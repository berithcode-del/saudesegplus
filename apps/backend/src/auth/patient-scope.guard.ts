import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PatientScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string; profileId?: string | null };
      params?: { id?: string };
    }>();

    if (request.user?.role === 'ADMIN') return true;
    if (
      request.user?.role !== 'PATIENT' ||
      !request.user.profileId ||
      request.params?.id !== request.user.profileId
    ) {
      throw new ForbiddenException('Acesso restrito ao proprio cadastro');
    }
    return true;
  }
}
