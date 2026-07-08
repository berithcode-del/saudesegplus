import { Injectable, NotFoundException } from '@nestjs/common';
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
  ): Promise<PaginatedResult<any>> {
    const where: any = {
      status: filters.status,
      patient: filters.companyId
        ? { companies: { some: { companyId: filters.companyId } } }
        : undefined,
      patientId: filters.patientId,
    };
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

  async findOne(id: string) {
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
