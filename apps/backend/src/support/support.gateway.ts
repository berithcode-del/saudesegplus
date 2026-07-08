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
  cors: { origin: '*' },
  namespace: '/support',
})
@UseGuards(WsJwtGuard)
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[Support WS] Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Support WS] Disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.join(`ticket:${data.ticketId}`);
    return { event: 'joined', data: { room: `ticket:${data.ticketId}` } };
  }

  @SubscribeMessage('leave_ticket')
  handleLeaveTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.leave(`ticket:${data.ticketId}`);
  }

  @SubscribeMessage('join_admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('support:admin');
    return { event: 'joined_admin' };
  }

  @SubscribeMessage('leave_admin')
  handleLeaveAdmin(@ConnectedSocket() client: Socket) {
    client.leave('support:admin');
  }

  emitNewMessage(ticketId: string, message: { id: string; content: string; authorRole: string; createdAt: Date }) {
    const payload = { ticketId, message };
    this.server.to(`ticket:${ticketId}`).emit('new_message', payload);
    this.server.to('support:admin').emit('new_message', payload);
  }

  emitNewTicket(ticket: { id: string; subject: string; userProfile: string; status: string; createdAt: Date }) {
    this.server.to('support:admin').emit('new_ticket', ticket);
  }

  emitTicketUpdated(ticketId: string, status: string) {
    const payload = { ticketId, status };
    this.server.to(`ticket:${ticketId}`).emit('ticket_updated', payload);
    this.server.to('support:admin').emit('ticket_updated', payload);
  }
}
