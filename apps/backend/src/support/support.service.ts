import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupportGateway } from './support.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private supportGateway: SupportGateway,
  ) {}

  async createTicket(dto: CreateTicketDto, user: JwtPayload) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: user.sub,
        userProfile: dto.userProfile,
        companyId: dto.companyId,
        clinicId: dto.clinicId,
        doctorId: dto.doctorId,
        subject: dto.subject,
      },
    });

    this.supportGateway.emitNewTicket({
      id: ticket.id,
      subject: ticket.subject,
      userProfile: ticket.userProfile,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });

    return ticket;
  }

  async listUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    if (ticket.userId !== userId) throw new ForbiddenException('Acesso negado');
    return ticket;
  }

  async sendMessage(
    ticketId: string,
    dto: SendMessageDto,
    user: JwtPayload,
    authorRole: 'USER' | 'ADMIN',
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    if (authorRole === 'USER' && ticket.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        content: dto.content,
        authorId: user.sub,
        authorRole,
      },
    });

    if (authorRole === 'ADMIN') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'EM_ATENDIMENTO' },
      });
    }

    this.supportGateway.emitNewMessage(ticketId, message);

    return message;
  }

  async updateStatus(ticketId: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as any },
    });

    this.supportGateway.emitTicketUpdated(ticketId, status);

    return updated;
  }

  async listAllTickets(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
  }

  async getAdminTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    return ticket;
  }

  async sendAdminMessage(ticketId: string, dto: SendMessageDto, user: JwtPayload) {
    return this.sendMessage(ticketId, dto, user, 'ADMIN');
  }
}
