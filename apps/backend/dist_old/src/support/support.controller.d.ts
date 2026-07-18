import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    createTicket(dto: CreateTicketDto, req: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listUserTickets(req: any): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    getTicket(id: string, req: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    sendMessage(id: string, dto: SendMessageDto, req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        };
    }>;
    listAllTickets(req: any, status?: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: ({
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
        })[];
        message?: undefined;
    }>;
    getAdminTicket(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
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
        };
        message?: undefined;
    }>;
    sendAdminMessage(id: string, dto: SendMessageDto, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            authorRole: string;
            ticketId: string;
        };
        message?: undefined;
    }>;
    updateTicketStatus(id: string, body: {
        status: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
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
        };
        message?: undefined;
    }>;
}
