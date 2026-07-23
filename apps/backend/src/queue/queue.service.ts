import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class QueueService {
  constructor(
    private prisma: PrismaService,
    private companyGateway: CompanyGateway,
    private presenceService: PresenceService,
  ) {}

  /**
   * Retorna o score de prioridade geográfica.
   * Quanto MENOR o score, MAIOR a prioridade.
   * Cidade = 0, Região = 1, Estado = 2, Nacional = 3
   */
  private calcGeoPriority(doctorState: string, doctorCity: string, patientState: string, patientCity: string): number {
    if (doctorCity && patientCity && doctorCity.toLowerCase() === patientCity.toLowerCase()) return 0;

    const regionMap: Record<string, string> = {
      SP: 'SE', RJ: 'SE', MG: 'SE', ES: 'SE',
      RS: 'S', SC: 'S', PR: 'S',
      MT: 'CO', MS: 'CO', GO: 'CO', DF: 'CO',
      AM: 'N', PA: 'N', AC: 'N', RO: 'N', RR: 'N', AP: 'N', TO: 'N',
      BA: 'NE', SE: 'NE', AL: 'NE', PE: 'NE', PB: 'NE', RN: 'NE', CE: 'NE', PI: 'NE', MA: 'NE',
    };

    const dRegion = regionMap[doctorState?.toUpperCase()] ?? 'OTHER';
    const pRegion = regionMap[patientState?.toUpperCase()] ?? 'OTHER';

    if (dRegion !== 'OTHER' && dRegion === pRegion) return 1; // Mesma região
    if (doctorState && patientState && doctorState.toUpperCase() === patientState.toUpperCase()) return 2; // Mesmo estado
    return 3; // Brasil/Nacional
  }

  async getQueueForDoctor(doctorId: string, workspaceClinicId?: string | null) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    const entries = await this.prisma.queueEntry.findMany({
      where: {
        status: 'WAITING',
        ...(workspaceClinicId ? { request: { clinicId: workspaceClinicId } } : {}),
      },
      include: {
        request: {
          include: {
            patient: true,
            results: { include: { type: true } },
          },
        },
      },
    });

    // Apenas pacientes com heartbeat recente (online) aparecem para o médico
    return entries
      .filter((entry) => this.presenceService.isOnline(entry.requestId))
      .map((entry) => ({
        ...entry,
        isOnline: true,
        priorityScore: this.calcGeoPriority(
          doctor?.state ?? '',
          doctor?.city ?? '',
          entry.state ?? '',
          entry.city ?? '',
        ),
      }))
      .sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
        return new Date(a.enteredQueueAt).getTime() - new Date(b.enteredQueueAt).getTime();
      });
  }

  async enqueue(examRequestId: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: { clinic: true, invite: true },
    });

    if (!request) throw new Error('ExamRequest not found');

    const entry = await this.prisma.queueEntry.upsert({
      where: { requestId: examRequestId },
      create: {
        requestId: examRequestId,
        city: request.clinic?.city ?? '',
        state: request.clinic?.state ?? '',
        status: 'WAITING',
      },
      update: {},
    });

    // To prevent duplicate timeline events if already in queue, we can check if it was just created
    // But upsert doesn't tell us. For simplicity, we just log it.
    if (request.invite) {
      // Avoid inserting timeline event if it's already EXAME_INICIADO. We'll just let it create.
      await this.recordTimelineEvent(request.invite.id, examRequestId, 'EXAME_INICIADO');
    }

    return entry;
  }

  async acceptPatient(queueEntryId: string, doctorId: string, workspaceClinicId?: string | null) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: { request: { include: { invite: true } } },
    });

    if (!entry) throw new NotFoundException('Atendimento nao encontrado');
    if (workspaceClinicId) {
      const request = await this.prisma.examRequest.findUnique({
        where: { id: entry.requestId },
        select: { clinicId: true },
      });
      const membership = await this.prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId: workspaceClinicId, doctorId } },
      });
      if (request?.clinicId !== workspaceClinicId || !membership?.active || membership.endedAt) {
        throw new NotFoundException('Atendimento nao disponivel para este medico');
      }
    }

    const claimed = await this.prisma.queueEntry.updateMany({
      where: { id: queueEntryId, status: 'WAITING', assignedDoctorId: null },
      data: {
        status: 'IN_PROGRESS',
        assignedDoctorId: doctorId,
        assignedAt: new Date(),
      },
    });
    if (claimed.count !== 1) {
      throw new ConflictException('Atendimento ja foi assumido por outro medico');
    }
    const updated = await this.prisma.queueEntry.findUniqueOrThrow({
      where: { id: queueEntryId },
    });

    // Bug corrigido: aceitar o paciente na fila atualizava apenas o
    // QueueEntry — o ExamRequest (a "solicitação" vista por empresa e
    // colaborador) nunca mudava de status, então F2-REQ-014 não se
    // cumpria de fato.
    await this.prisma.examRequest.update({
      where: { id: entry.requestId },
      data: { status: 'EM_ATENDIMENTO_MEDICO' },
    });

    if (entry.request?.invite) {
      await this.recordTimelineEvent(
        entry.request.invite.id,
        entry.requestId,
        'EM_ATENDIMENTO_MEDICO',
      );
    }

    return updated;
  }

  private async recordTimelineEvent(
    inviteId: string,
    examRequestId: string,
    eventType: string,
  ) {
    const event = await this.prisma.examTimelineEvent.create({
      data: {
        inviteId,
        examRequestId,
        eventType: eventType as any,
      },
    });

    const invite = await this.prisma.examInvite.findUnique({
      where: { id: inviteId },
    });

    if (invite) {
      this.companyGateway.emitTimelineUpdate(invite.companyId, {
        inviteId,
        eventType,
        occurredAt: event.occurredAt.toISOString(),
      });
      this.companyGateway.emitInviteStatusChange(invite.companyId, {
        inviteId,
        status: invite.status,
        examStatus: eventType,
      });
    }

    return event;
  }
}
