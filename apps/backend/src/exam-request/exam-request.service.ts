import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { paginate, PaginatedResult } from '../common/pagination';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class ExamRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyGateway: CompanyGateway,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Lista solicitações, com filtros opcionais — usada pelo
   * AppointmentsTable / ScheduleCalendar (F2-REQ-010) e pelo
   * DoctorDashboard (F2-REQ-012). Antes não existia nenhum endpoint
   * equivalente: os módulos exams/aso eram mocks fixos (`id !== '1'`).
   */
  async list(
    filters: { status?: string; companyId?: string; patientId?: string },
    page: number = 1,
    limit: number = 20,
    user?: { role: string; profileId?: string | null },
  ): Promise<PaginatedResult<any>> {
    const scopedCompanyId = user?.role === 'COMPANY_ADMIN' ? user.profileId : filters.companyId;
    const where: any = {
      status: filters.status,
      patient: scopedCompanyId
        ? { companies: { some: { companyId: scopedCompanyId } } }
        : undefined,
      patientId: filters.patientId,
    };
    if (user?.role === 'DOCTOR') {
      where.queueEntry = { assignedDoctorId: user.profileId };
    } else if (user?.role === 'CLINIC') {
      where.clinicId = user.profileId;
    } else if (user?.role === 'OPERATOR') {
      const operator = await this.prisma.operator.findUnique({
        where: { id: user.profileId ?? '' },
        select: { clinicId: true },
      });
      if (!operator) throw new ForbiddenException('Acesso negado');
      where.clinicId = operator.clinicId;
    }
    return paginate(this.prisma.examRequest, page, limit, {
      where,
      include: {
        patient: true,
        clinic: true,
        invite: true,
        results: { include: { type: true } },
        asoDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user?: { role: string; profileId?: string | null }) {
    if (user) await this.assertAccess(id, user);
    const request = await this.prisma.examRequest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            anamneses: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        clinic: true,
        invite: { include: { company: true } },
        results: { include: { type: true } },
        asoDocuments: true,
        teleconsultations: { orderBy: { startedAt: 'desc' }, take: 1 },
      },
    });
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    const results = request.results.map(r => ({ ...r, valueJson: JSON.parse(r.valueJson) }));
    return {
      ...request,
      results,
      presence: {
        patientOnline: this.presenceService.isOnline(request.id),
      },
    };
  }

  async assertAccess(
    id: string,
    user: { role: string; profileId?: string | null },
    write = false,
  ) {
    if (user.role === 'ADMIN') return;
    const request = await this.prisma.examRequest.findUnique({
      where: { id },
      include: {
        invite: true,
        queueEntry: true,
        patient: { include: { companies: true } },
      },
    });
    if (!request) throw new NotFoundException('Solicitacao nao encontrada');

    let allowed = false;
    if (user.role === 'COMPANY_ADMIN') {
      allowed = !write && request.patient.companies.some(
        (relation) => relation.companyId === user.profileId && !relation.endDate,
      );
    } else if (user.role === 'DOCTOR') {
      allowed = request.queueEntry?.assignedDoctorId === user.profileId;
    } else if (user.role === 'CLINIC') {
      allowed = request.clinicId === user.profileId;
    } else if (user.role === 'OPERATOR') {
      const operator = await this.prisma.operator.findUnique({
        where: { id: user.profileId ?? '' },
        select: { clinicId: true },
      });
      allowed = operator?.clinicId === request.clinicId;
    }

    if (!allowed) throw new ForbiddenException('Acesso negado a esta solicitacao');
  }

  /**
   * Atualiza status (e opcionalmente um laudo simplificado em texto,
   * conforme F2-REQ-013) e propaga a mudança para empresa e
   * colaborador em tempo real.
   */
  async updateStatus(id: string, body: { status: string; laudoTexto?: string; decision?: string; restrictionNotes?: string; doctorId?: string }) {
    const existing = await this.prisma.examRequest.findUnique({
      where: { id },
      include: { invite: true },
    });
    if (!existing) throw new NotFoundException('Solicitação não encontrada');

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.examRequest.update({ where: { id }, data: { status: body.status } });

      if (body.decision) {
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        await tx.asoDocument.create({
          data: {
            requestId: id,
            doctorId: body.doctorId ?? 'system',
            decision: body.decision,
            restrictionNotes: body.restrictionNotes ?? null,
            validUntil,
          },
        });
      }

      if (body.laudoTexto && existing.invite) {
        await tx.examTimelineEvent.create({
          data: { inviteId: existing.invite.id, examRequestId: id, eventType: 'CONCLUIDO', metadata: body.laudoTexto },
        });
      }
      return req;
    });

    if (existing.invite) {
      this.companyGateway.emitInviteStatusChange(existing.invite.companyId, {
        inviteId: existing.invite.id,
        status: existing.invite.status,
        examStatus: body.status,
      });
    }

    return updated;
  }
}
