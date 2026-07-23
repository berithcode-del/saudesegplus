import { ForbiddenException, Injectable } from '@nestjs/common';
import { ClinicActorType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from './jwt.strategy';

export interface ClinicActorContext {
  clinicId: string;
  actorType: ClinicActorType;
  actorId: string;
  actorName: string;
  actorSessionId?: string | null;
  operatorId?: string | null;
}

@Injectable()
export class ClinicActorService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(user: JwtPayload, expectedClinicId?: string | null): Promise<ClinicActorContext> {
    if (user.role === 'OPERATOR' && user.profileId) {
      const operator = await this.prisma.operator.findUnique({ where: { id: user.profileId } });
      if (!operator?.isActive) throw new ForbiddenException('Operador inativo');
      if (expectedClinicId && operator.clinicId !== expectedClinicId) {
        throw new ForbiddenException('Profissional nao pertence a clinica da solicitacao');
      }
      return {
        clinicId: operator.clinicId,
        actorType: ClinicActorType.OPERATOR,
        actorId: operator.id,
        actorName: operator.name,
        actorSessionId: user.actorSessionId,
        operatorId: operator.id,
      };
    }

    if (user.role === 'DOCTOR' && user.profileId) {
      const clinicId = user.workspaceClinicId ?? expectedClinicId;
      if (!clinicId || (expectedClinicId && clinicId !== expectedClinicId)) {
        throw new ForbiddenException('Ambiente da clinica nao identificado');
      }
      const membership = await this.prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId, doctorId: user.profileId } },
        include: { doctor: true },
      });
      if (!membership?.active || membership.endedAt) {
        throw new ForbiddenException('Medico nao esta ativo nesta clinica');
      }
      return {
        clinicId,
        actorType: ClinicActorType.DOCTOR,
        actorId: membership.doctor.id,
        actorName: membership.doctor.name,
        actorSessionId: user.actorSessionId,
      };
    }

    throw new ForbiddenException('Selecione um profissional antes de executar esta acao');
  }

  async audit(
    actor: ClinicActorContext,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.clinicAuditEvent.create({
      data: {
        clinicId: actor.clinicId,
        actorSessionId: actor.actorSessionId ?? null,
        actorType: actor.actorType,
        actorId: actor.actorId,
        actorName: actor.actorName,
        action,
        resourceType,
        resourceId,
        metadata: metadata as any,
      },
    });
  }
}
