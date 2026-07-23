import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class MedicalSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(user: JwtPayload, query: string, limit = 5) {
    const doctorId = user.profileId;
    const q = query.trim();
    const safeLimit = Math.min(Math.max(limit || 5, 1), 10);
    if (!doctorId || q.length < 3) return { patients: [], protocols: [] };

    const workspaceClinicId = user.workspaceClinicId ?? null;
    if (workspaceClinicId) {
      const membership = await this.prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId: workspaceClinicId, doctorId } },
      });
      if (!membership?.active || membership.endedAt) {
        throw new ForbiddenException('Medico nao pertence a clinica ativa');
      }
    }

    const requestScope: Prisma.ExamRequestWhereInput[] = [
      { queueEntry: { assignedDoctorId: doctorId } },
      { processoAso: { medicoId: doctorId } },
    ];
    if (workspaceClinicId) requestScope.push({ clinicId: workspaceClinicId });

    const patientMatches = await this.prisma.examRequest.findMany({
      where: {
        OR: requestScope,
        patient: { name: { contains: q, mode: 'insensitive' } },
      },
      include: {
        patient: true,
        processoAso: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit * 4,
    });

    const seenPatients = new Set<string>();
    const patients = patientMatches
      .filter((request) => {
        if (seenPatients.has(request.patientId)) return false;
        seenPatients.add(request.patientId);
        return true;
      })
      .slice(0, safeLimit)
      .map((request) => ({
        id: request.patient.id,
        name: request.patient.name,
        cpf: this.maskCpf(request.patient.cpf),
        lastExamAt: request.updatedAt,
        processoNumero: request.processoAso?.numeroProtocolo ?? null,
        examRequestId: request.id,
      }));

    const protocolWhere: Prisma.ProcessoASOWhereInput = {
      numeroProtocolo: { contains: q, mode: 'insensitive' },
      OR: [
        { medicoId: doctorId },
        { examRequest: { queueEntry: { assignedDoctorId: doctorId } } },
        ...(workspaceClinicId ? [{ clinicaId: workspaceClinicId }] : []),
      ],
    };

    const protocols = await this.prisma.processoASO.findMany({
      where: protocolWhere,
      include: {
        paciente: true,
        examRequest: { include: { patient: true } },
      },
      orderBy: { dataAbertura: 'desc' },
      take: safeLimit,
    });

    return {
      patients,
      protocols: protocols.map((protocol) => ({
        id: protocol.id,
        numeroProtocolo: protocol.numeroProtocolo,
        patientName: protocol.paciente?.name ?? protocol.examRequest?.patient.name ?? null,
        status: protocol.status,
        dataAbertura: protocol.dataAbertura,
        examRequestId: protocol.examRequestId ?? protocol.examRequest?.id ?? null,
      })),
    };
  }

  private maskCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 3) return '***.***.***-**';
    return `***.***.${digits.slice(-5, -2)}-${digits.slice(-2)}`;
  }
}
