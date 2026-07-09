import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { getAllowedOrigins } from '../security/allowed-origins';

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
  },
})
@UseGuards(WsJwtGuard)
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Emite para todos os clientes quando status de um paciente muda
  emitQueueUpdate(event: string, payload: object) {
    this.server.emit(event, payload);
  }

  emitProcessUpdate(processId: string, event: string, payload: object) {
    this.server.to(`process:${processId}`).emit(event, payload);
    this.server.emit(event, payload);
  }

  @SubscribeMessage('join_process')
  handleJoinProcess(
    @MessageBody() data: { processId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.processId) return;
    const user = client.data.user as { role?: string; processId?: string } | undefined;
    if (user?.role === 'PORTAL' && user.processId !== data.processId) return;
    client.join(`process:${data.processId}`);
  }

  @SubscribeMessage('doctor_viewing_patient')
  handleDoctorViewingPatient(
    @MessageBody() data: { processId?: string; doctorId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.processId) return;
    const user = client.data.user as { role?: string; profileId?: string } | undefined;
    if (user?.role !== 'DOCTOR' || user.profileId !== data.doctorId) return;
    this.emitProcessUpdate(data.processId, 'doctor_viewing_patient', {
      processId: data.processId,
      doctorId: data.doctorId ?? null,
      viewedAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('doctor_online')
  handleDoctorOnline(
    @MessageBody() data: { doctorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as { role?: string; profileId?: string } | undefined;
    if (user?.role !== 'DOCTOR' || user.profileId !== data.doctorId) return;
    this.server.emit('doctor_status', { doctorId: data.doctorId, status: 'online' });
  }
}
