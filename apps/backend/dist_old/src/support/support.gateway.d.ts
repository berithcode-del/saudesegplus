import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTicket(client: Socket, data: {
        ticketId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    handleLeaveTicket(client: Socket, data: {
        ticketId: string;
    }): void;
    handleJoinAdmin(client: Socket): {
        event: string;
        data: {
            message: string;
        };
    } | {
        event: string;
        data?: undefined;
    };
    handleLeaveAdmin(client: Socket): void;
    emitNewMessage(ticketId: string, message: {
        id: string;
        content: string;
        authorRole: string;
        createdAt: Date;
    }): void;
    emitNewTicket(ticket: {
        id: string;
        subject: string;
        userProfile: string;
        status: string;
        createdAt: Date;
    }): void;
    emitTicketUpdated(ticketId: string, status: string): void;
}
