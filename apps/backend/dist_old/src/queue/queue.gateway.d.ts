import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitQueueUpdate(event: string, payload: object): void;
    emitProcessUpdate(processId: string, event: string, payload: object): void;
    handleJoinProcess(data: {
        processId?: string;
    }, client: Socket): void;
    handleDoctorViewingPatient(data: {
        processId?: string;
        doctorId?: string;
    }, client: Socket): void;
    handleDoctorOnline(data: {
        doctorId: string;
    }, client: Socket): void;
}
