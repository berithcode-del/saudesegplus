import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

type AuthenticatedUser = {
  role?: string;
  profileId?: string | null;
};

@Injectable()
export class CompanyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: Record<string, string>;
      body?: Record<string, unknown>;
      headers?: Record<string, string | undefined>;
      method?: string;
    }>();

    if (request.user?.role === 'ADMIN') return true;
    if (request.user?.role !== 'COMPANY_ADMIN' || !request.user.profileId) {
      throw new ForbiddenException('Acesso restrito a esta empresa');
    }

    const contentType = request.headers?.['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let requestedCompanyId: string | undefined;
    if (!isMultipart) {
      requestedCompanyId =
        request.params?.companyId ??
        request.params?.id ??
        (typeof request.body?.companyId === 'string' ? request.body.companyId : undefined);
    } else {
      requestedCompanyId = request.user.profileId;
    }

    if (!requestedCompanyId || requestedCompanyId !== request.user.profileId) {
      throw new ForbiddenException('Acesso restrito a esta empresa');
    }

    return true;
  }
}
