import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from './jwt.strategy';
import { ActivateClinicActorDto } from './dto/clinic-actor.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private resolveWorkspaceClinicId(user: JwtPayload): string {
    const clinicId = user.role === 'CLINIC' ? user.profileId : user.workspaceClinicId;
    if (!clinicId) throw new ForbiddenException('Ambiente da clinica nao identificado');
    return clinicId;
  }

  async listClinicActors(user: JwtPayload) {
    const clinicId = this.resolveWorkspaceClinicId(user);
    const [operators, memberships] = await Promise.all([
      this.prisma.operator.findMany({
        where: { clinicId, isActive: true },
        select: { id: true, name: true, operationalPinHash: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.clinicDoctor.findMany({
        where: { clinicId, active: true, endedAt: null },
        include: { doctor: true },
        orderBy: { doctor: { name: 'asc' } },
      }),
    ]);
    return {
      clinicId,
      actors: [
        ...operators.map((operator) => ({
          id: operator.id,
          type: 'OPERATOR' as const,
          name: operator.name,
          pinConfigured: Boolean(operator.operationalPinHash),
        })),
        ...memberships.map(({ doctor, operationalPinHash }) => ({
          id: doctor.id,
          type: 'DOCTOR' as const,
          name: doctor.name,
          subtitle: `CRM ${doctor.crmNumber}/${doctor.crmState}`,
          pinConfigured: Boolean(operationalPinHash),
        })),
      ],
    };
  }

  async activateClinicActor(user: JwtPayload, dto: ActivateClinicActorDto) {
    const clinicId = this.resolveWorkspaceClinicId(user);
    let actor: { id: string; name: string; pinHash: string | null; role: 'OPERATOR' | 'DOCTOR' };

    if (dto.actorType === 'OPERATOR') {
      const operator = await this.prisma.operator.findUnique({ where: { id: dto.actorId } });
      if (!operator || operator.clinicId !== clinicId || !operator.isActive) {
        throw new ForbiddenException('Profissional nao pertence a esta clinica');
      }
      actor = { id: operator.id, name: operator.name, pinHash: operator.operationalPinHash, role: 'OPERATOR' };
    } else {
      const membership = await this.prisma.clinicDoctor.findUnique({
        where: { clinicId_doctorId: { clinicId, doctorId: dto.actorId } },
        include: { doctor: true },
      });
      if (!membership || !membership.active || membership.endedAt) {
        throw new ForbiddenException('Medico nao pertence a esta clinica');
      }
      actor = {
        id: membership.doctor.id,
        name: membership.doctor.name,
        pinHash: membership.operationalPinHash,
        role: 'DOCTOR',
      };
    }

    if (!actor.pinHash || !(await bcrypt.compare(dto.pin, actor.pinHash))) {
      throw new UnauthorizedException('PIN operacional invalido');
    }

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const session = await this.prisma.clinicActorSession.create({
      data: { clinicId, actorType: actor.role, actorId: actor.id, actorName: actor.name, expiresAt },
    });
    await this.prisma.clinicAuditEvent.create({
      data: {
        clinicId,
        actorSessionId: session.id,
        actorType: actor.role,
        actorId: actor.id,
        actorName: actor.name,
        action: 'ACTOR_SESSION_STARTED',
        resourceType: 'CLINIC_SESSION',
        resourceId: session.id,
      },
    });

    const token = this.jwtService.sign({
      sub: user.sub,
      email: user.email,
      role: actor.role,
      profileId: actor.id,
      baseRole: 'CLINIC',
      workspaceClinicId: clinicId,
      actorSessionId: session.id,
      actorName: actor.name,
    }, { expiresIn: '4h' });
    return { token, expiresAt, actor: { id: actor.id, type: actor.role, name: actor.name } };
  }

  async endClinicActorSession(user: JwtPayload) {
    if (!user.actorSessionId) return { success: true };
    await this.prisma.clinicActorSession.updateMany({
      where: { id: user.actorSessionId, endedAt: null },
      data: { endedAt: new Date() },
    });
    return { success: true };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        operatorProfile: { include: { clinic: true } },
        patientProfile: true,
        companyAdminProfile: { include: { company: true } },
        clinicProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let profileId: string | null = null;
    if (user.role === 'DOCTOR') {
      if (!user.doctorProfile?.verifiedAt) {
        throw new UnauthorizedException('Cadastro pendente de aprovação pela administração.');
      }
      profileId = user.doctorProfile.id;
    }
    else if (user.role === 'COMPANY_ADMIN') profileId = user.companyAdminProfile?.companyId ?? null;
    else if (user.role === 'OPERATOR') profileId = user.operatorProfile?.id ?? null;
    else if (user.role === 'CLINIC') profileId = user.clinicProfile?.id ?? null;
    else if (user.role === 'PATIENT') profileId = user.patientProfile?.id ?? null;

    const payload = { sub: user.id, email: user.email, role: user.role, profileId };
    const token = this.jwtService.sign(payload);

    const { passwordHash, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async me(userId: string, session?: JwtPayload) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        operatorProfile: { include: { clinic: true } },
        patientProfile: true,
        companyAdminProfile: { include: { company: true } },
        clinicProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      ...(session?.actorSessionId
        ? {
            role: session.role,
            baseRole: session.baseRole,
            workspaceClinicId: session.workspaceClinicId,
            activeActor: {
              id: session.profileId,
              type: session.role,
              name: session.actorName,
              sessionId: session.actorSessionId,
            },
          }
        : {}),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.userAccount.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Senha alterada com sucesso' };
  }
}
