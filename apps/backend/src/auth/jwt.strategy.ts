import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret';
import { PrismaService } from '../prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  profileId?: string | null;
  workspaceClinicId?: string | null;
  actorSessionId?: string | null;
  actorName?: string | null;
  baseRole?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.actorSessionId) {
      const session = await this.prisma.clinicActorSession.findFirst({
        where: {
          id: payload.actorSessionId,
          clinicId: payload.workspaceClinicId ?? '',
          endedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!session) throw new UnauthorizedException('Sessao do profissional expirada');
      await this.prisma.clinicActorSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      profileId: payload.profileId ?? null,
      workspaceClinicId: payload.workspaceClinicId ?? null,
      actorSessionId: payload.actorSessionId ?? null,
      actorName: payload.actorName ?? null,
      baseRole: payload.baseRole ?? null,
    };
  }
}
