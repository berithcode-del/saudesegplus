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

@WebSocketGateway({
  cors: {
    origin: '*',
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
    client.join(`process:${data.processId}`);
  }

  @SubscribeMessage('doctor_viewing_patient')
  handleDoctorViewingPatient(@MessageBody() data: { processId?: string; doctorId?: string }) {
    if (!data?.processId) return;
    this.emitProcessUpdate(data.processId, 'doctor_viewing_patient', {
      processId: data.processId,
      doctorId: data.doctorId ?? null,
      viewedAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('doctor_online')
  handleDoctorOnline(@MessageBody() data: { doctorId: string }) {
    this.server.emit('doctor_status', { doctorId: data.doctorId, status: 'online' });
  }
}
