"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const support_gateway_1 = require("./support.gateway");
let SupportService = class SupportService {
    prisma;
    supportGateway;
    constructor(prisma, supportGateway) {
        this.prisma = prisma;
        this.supportGateway = supportGateway;
    }
    async createTicket(dto, user) {
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
    async listUserTickets(userId) {
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
    async getTicket(ticketId, userId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket não encontrado');
        if (ticket.userId !== userId)
            throw new common_1.ForbiddenException('Acesso negado');
        return ticket;
    }
    async sendMessage(ticketId, dto, user, authorRole) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket não encontrado');
        if (authorRole === 'USER' && ticket.userId !== user.sub) {
            throw new common_1.ForbiddenException('Acesso negado');
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
    async updateStatus(ticketId, status) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket não encontrado');
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: status },
        });
        this.supportGateway.emitTicketUpdated(ticketId, status);
        return updated;
    }
    async listAllTickets(status) {
        const where = {};
        if (status)
            where.status = status;
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
    async getAdminTicket(ticketId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { email: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket não encontrado');
        return ticket;
    }
    async sendAdminMessage(ticketId, dto, user) {
        return this.sendMessage(ticketId, dto, user, 'ADMIN');
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        support_gateway_1.SupportGateway])
], SupportService);
//# sourceMappingURL=support.service.js.map