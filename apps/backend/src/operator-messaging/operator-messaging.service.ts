import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataEnvironment, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

const ALLOWED_ROLES: Role[] = [
  Role.ADMIN,
  Role.CLINIC,
  Role.DOCTOR,
  Role.OPERATOR,
];

interface Principal {
  userId: string;
  role: Role;
  name: string;
  environment: DataEnvironment | null;
}

@Injectable()
export class OperatorMessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listRecipients(user: JwtPayload, query = '') {
    const principal = await this.resolvePrincipal(user);
    const q = query.trim();
    const filters: Prisma.UserAccountWhereInput[] = [];
    if (q) {
      filters.push({
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { doctorProfile: { name: { contains: q, mode: 'insensitive' } } },
          { clinicProfile: { name: { contains: q, mode: 'insensitive' } } },
          { operatorProfile: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    if (principal.environment) {
      filters.push({
        OR: [
          { role: Role.ADMIN },
          { doctorProfile: { environment: principal.environment } },
          { clinicProfile: { environment: principal.environment } },
          {
            operatorProfile: {
              clinic: { environment: principal.environment },
            },
          },
        ],
      });
    }
    const users = await this.prisma.userAccount.findMany({
      where: {
        role: { in: ALLOWED_ROLES },
        ...(filters.length ? { AND: filters } : {}),
      },
      include: {
        doctorProfile: true,
        clinicProfile: true,
        operatorProfile: { include: { clinic: true } },
      },
      orderBy: { email: 'asc' },
      take: 20,
    });
    return users.map((userAccount) => ({
      userId: userAccount.id,
      role: userAccount.role,
      name:
        userAccount.doctorProfile?.name ??
        userAccount.clinicProfile?.name ??
        userAccount.operatorProfile?.name ??
        userAccount.email,
      email: userAccount.email,
    }));
  }

  async listConversations(user: JwtPayload) {
    const principal = await this.resolvePrincipal(user);
    const conversations = await this.prisma.operatorConversation.findMany({
      where: { participants: { some: { userId: principal.userId } } },
      include: {
        participants: true,
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return conversations.map((conversation) => ({
      ...conversation,
      unread: conversation.participants.some(
        (participant) =>
          participant.userId === principal.userId &&
          conversation.messages[0]?.sentAt &&
          (!participant.lastReadAt ||
            participant.lastReadAt < conversation.messages[0].sentAt),
      ),
    }));
  }

  async createConversation(
    user: JwtPayload,
    participantIds: string[],
    title?: string,
    isGroup = false,
  ) {
    const principal = await this.resolvePrincipal(user);
    const uniqueIds = Array.from(
      new Set([principal.userId, ...participantIds]),
    );
    if (uniqueIds.length < 2)
      throw new BadRequestException('Informe pelo menos um destinatario');
    if (uniqueIds.length > 10)
      throw new BadRequestException(
        'A conversa pode ter no maximo 10 participantes',
      );
    if (isGroup && principal.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Somente administradores podem criar grupos nesta etapa',
      );
    }
    if (isGroup && !title?.trim())
      throw new BadRequestException('Informe um titulo para o grupo');

    const users = await this.prisma.userAccount.findMany({
      where: { id: { in: uniqueIds }, role: { in: ALLOWED_ROLES } },
      include: {
        doctorProfile: true,
        clinicProfile: true,
        operatorProfile: { include: { clinic: true } },
      },
    });
    if (users.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Algum participante informado nao existe ou nao pode receber mensagens',
      );
    }
    if (
      principal.environment &&
      users.some(
        (participant) =>
          participant.role !== Role.ADMIN &&
          this.accountEnvironment(participant) !== principal.environment,
      )
    ) {
      throw new BadRequestException(
        'Perfis reais e sandbox nao podem participar da mesma conversa',
      );
    }

    return this.prisma.operatorConversation.create({
      data: {
        title: isGroup ? title?.trim() : null,
        isGroup,
        participants: {
          create: users.map((participant) => ({
            userId: participant.id,
            role: participant.role,
            displayName:
              participant.doctorProfile?.name ??
              participant.clinicProfile?.name ??
              participant.operatorProfile?.name ??
              participant.email,
          })),
        },
      },
      include: { participants: true, messages: true },
    });
  }

  async listMessages(user: JwtPayload, conversationId: string) {
    const principal = await this.resolvePrincipal(user);
    await this.assertParticipant(conversationId, principal.userId);
    await this.prisma.operatorConversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId: principal.userId },
      },
      data: { lastReadAt: new Date() },
    });
    await this.prisma.notification.updateMany({
      where: {
        userId: principal.userId,
        targetId: conversationId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return this.prisma.operatorMessage.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });
  }

  async sendMessage(
    user: JwtPayload,
    conversationId: string,
    content: string,
    attachments: string[] = [],
  ) {
    const principal = await this.resolvePrincipal(user);
    const conversation = await this.assertParticipant(
      conversationId,
      principal.userId,
    );
    if (!content.trim() && attachments.length === 0) {
      throw new BadRequestException('Digite uma mensagem ou informe um anexo');
    }

    const message = await this.prisma.operatorMessage.create({
      data: {
        conversationId,
        authorId: principal.userId,
        authorName: principal.name,
        content: content.trim(),
        attachments,
      },
    });
    await this.prisma.operatorConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recipients = conversation.participants.filter(
      (participant) => participant.userId !== principal.userId,
    );
    await this.prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.userId,
        type: 'OPERATOR_MESSAGE',
        title: conversation.title ?? `Mensagem de ${principal.name}`,
        body: content.trim().slice(0, 160),
        targetId: conversationId,
      })),
    });

    return message;
  }

  async listNotifications(user: JwtPayload, unreadOnly = false) {
    const principal = await this.resolvePrincipal(user);
    return this.prisma.notification.findMany({
      where: {
        userId: principal.userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(user: JwtPayload, notificationId: string) {
    const principal = await this.resolvePrincipal(user);
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: principal.userId },
      data: { readAt: new Date() },
    });
    if (!updated.count)
      throw new NotFoundException('Notificacao nao encontrada');
    return { success: true };
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.operatorConversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('Conversa nao encontrada');
    if (
      !conversation.participants.some(
        (participant) => participant.userId === userId,
      )
    ) {
      throw new ForbiddenException('Voce nao participa desta conversa');
    }
    return conversation;
  }

  private async resolvePrincipal(user: JwtPayload): Promise<Principal> {
    if (!ALLOWED_ROLES.includes(user.role as Role)) {
      throw new ForbiddenException(
        'Mensagens operacionais nao estao disponiveis para este perfil',
      );
    }

    if (user.role === Role.DOCTOR && user.profileId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: user.profileId },
      });
      if (!doctor) throw new ForbiddenException('Perfil medico nao encontrado');
      return {
        userId: doctor.userId,
        role: Role.DOCTOR,
        name: doctor.name,
        environment: doctor.environment,
      };
    }
    if (user.role === Role.OPERATOR && user.profileId) {
      const operator = await this.prisma.operator.findUnique({
        where: { id: user.profileId },
        include: { clinic: { select: { environment: true } } },
      });
      if (!operator)
        throw new ForbiddenException('Perfil operador nao encontrado');
      return {
        userId: operator.userId,
        role: Role.OPERATOR,
        name: operator.name,
        environment: operator.clinic.environment,
      };
    }
    if (user.role === Role.CLINIC && user.profileId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: user.profileId },
      });
      if (!clinic?.userId)
        throw new ForbiddenException('Perfil da clinica nao encontrado');
      return {
        userId: clinic.userId,
        role: Role.CLINIC,
        name: clinic.name,
        environment: clinic.environment,
      };
    }

    const account = await this.prisma.userAccount.findUnique({
      where: { id: user.sub },
    });
    if (!account || !ALLOWED_ROLES.includes(account.role)) {
      throw new ForbiddenException(
        'Perfil nao autorizado para mensagens operacionais',
      );
    }
    return {
      userId: account.id,
      role: account.role,
      name: account.email,
      environment: null,
    };
  }

  private accountEnvironment(account: {
    doctorProfile?: { environment: DataEnvironment } | null;
    clinicProfile?: { environment: DataEnvironment } | null;
    operatorProfile?: {
      clinic?: { environment: DataEnvironment } | null;
    } | null;
  }) {
    return (
      account.doctorProfile?.environment ??
      account.clinicProfile?.environment ??
      account.operatorProfile?.clinic?.environment ??
      null
    );
  }
}
