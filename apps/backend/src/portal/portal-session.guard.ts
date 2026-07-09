import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from '../auth/jwt-secret';
import { Request } from 'express';

export interface PortalUser {
  patientId: string;
  processId: string;
  role: string;
}

@Injectable()
export class PortalSessionGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Token não encontrado');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: getJwtSecret(),
      });

      if (payload.role !== 'PORTAL') {
        throw new UnauthorizedException('Acesso não autorizado');
      }

      (request as any).user = {
        patientId: payload.sub,
        processId: payload.processId,
        role: payload.role,
      } as PortalUser;

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
