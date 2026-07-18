import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class CompanyGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private companyRooms;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinCompany(client: Socket, data: {
        companyId: string;
    }): {
        event: string;
        data: {
            message: string;
            room?: undefined;
        };
    } | {
        event: string;
        data: {
            room: string;
            message?: undefined;
        };
    };
    handleLeaveCompany(client: Socket, data: {
        companyId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    emitTimelineUpdate(companyId: string, payload: {
        inviteId: string;
        eventType: string;
        occurredAt: string;
    }): void;
    emitInviteStatusChange(companyId: string, payload: {
        inviteId: string;
        status: string;
        examStatus?: string;
    }): void;
    emitDashboardStats(companyId: string, stats: {
        total: number;
        sent: number;
        opened: number;
        inProgress: number;
        completed: number;
        expired: number;
    }): void;
    emitAsoExpirationAlert(companyId: string, payload: {
        windowDays: number;
        total: number;
        asos: Array<{
            asoId: string;
            patientName: string;
            examType: string;
            validUntil: string;
            daysUntilExpiration: number;
        }>;
    }): void;
}
