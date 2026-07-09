import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CompanyInviteScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string; profileId?: string | null };
      params?: { id?: string; inviteId?: string };
    }>();
    if (request.user?.role === 'ADMIN') return true;

    const inviteId = request.params?.inviteId ?? request.params?.id;
    if (!inviteId || request.user?.role !== 'COMPANY_ADMIN' || !request.user.profileId) {
      throw new ForbiddenException('Acesso restrito a esta empresa');
    }
    const invite = await this.prisma.examInvite.findUnique({
      where: { id: inviteId },
      select: { companyId: true },
    });
    if (!invite || invite.companyId !== request.user.profileId) {
      throw new ForbiddenException('Acesso restrito a esta empresa');
    }
    return true;
  }
}
