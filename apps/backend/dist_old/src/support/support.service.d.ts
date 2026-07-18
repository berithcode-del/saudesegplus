import { PrismaService } from '../prisma.service';
import { SupportGateway } from './support.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class SupportService {
    private prisma;
    private supportGateway;
    constructor(prisma: PrismaService, supportGateway: SupportGateway);
    createTicket(dto: CreateTicketDto, user: JwtPayload): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    }>;
    listUserTickets(userId: string): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    })[]>;
    getTicket(ticketId: string, userId: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    }>;
    sendMessage(ticketId: string, dto: SendMessageDto, user: JwtPayload, authorRole: 'USER' | 'ADMIN'): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        authorRole: string;
        ticketId: string;
    }>;
    updateStatus(ticketId: string, status: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    }>;
    listAllTickets(status?: string): Promise<({
        _count: {
            messages: number;
        };
        user: {
            email: string;
        };
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    })[]>;
    getAdminTicket(ticketId: string): Promise<{
        user: {
            email: string;
        };
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SupportTicketStatus;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
        doctorId: string | null;
        subject: string;
        userProfile: string;
    }>;
    sendAdminMessage(ticketId: string, dto: SendMessageDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        authorRole: string;
        ticketId: string;
    }>;
}
