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
  cors: { origin: getAllowedOrigins() },
  namespace: '/company',
})
@UseGuards(WsJwtGuard)
export class CompanyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private companyRooms = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    console.log(`[CompanyGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[CompanyGateway] Client disconnected: ${client.id}`);
    this.companyRooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) this.companyRooms.delete(roomId);
      }
    });
  }

  @SubscribeMessage('join_company')
  handleJoinCompany(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string },
  ) {
    const user = client.data.user as { role?: string; profileId?: string } | undefined;
    if (user?.role !== 'ADMIN' && user?.profileId !== data.companyId) {
      return { event: 'error', data: { message: 'Forbidden' } };
    }
    const room = `company:${data.companyId}`;
    client.join(room);

    if (!this.companyRooms.has(room)) {
      this.companyRooms.set(room, new Set());
    }
    this.companyRooms.get(room)!.add(client.id);

    console.log(`[CompanyGateway] Client ${client.id} joined room ${room}`);
    return { event: 'joined', data: { room } };
  }

  @SubscribeMessage('leave_company')
  handleLeaveCompany(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string },
  ) {
    const room = `company:${data.companyId}`;
    client.leave(room);
    this.companyRooms.get(room)?.delete(client.id);
    return { event: 'left', data: { room } };
  }

  emitTimelineUpdate(companyId: string, payload: {
    inviteId: string;
    eventType: string;
    occurredAt: string;
  }) {
    try {
      this.server.to(`company:${companyId}`).emit('timeline_update', payload);
    } catch (error) {
      console.error(`[CompanyGateway] Erro ao emitir timeline_update para ${companyId}:`, error);
    }
  }

  emitInviteStatusChange(companyId: string, payload: {
    inviteId: string;
    status: string;
    examStatus?: string;
  }) {
    try {
      this.server.to(`company:${companyId}`).emit('invite_status_change', payload);
    } catch (error) {
      console.error(`[CompanyGateway] Erro ao emitir invite_status_change para ${companyId}:`, error);
    }
  }

  emitDashboardStats(companyId: string, stats: {
    total: number;
    sent: number;
    opened: number;
    inProgress: number;
    completed: number;
    expired: number;
  }) {
    try {
      this.server.to(`company:${companyId}`).emit('dashboard_stats', stats);
    } catch (error) {
      console.error(`[CompanyGateway] Erro ao emitir dashboard_stats para ${companyId}:`, error);
    }
  }

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
  }) {
    try {
      this.server.to(`company:${companyId}`).emit('aso_expiration_alert', payload);
    } catch (error) {
      console.error(`[CompanyGateway] Erro ao emitir aso_expiration_alert para ${companyId}:`, error);
    }
  }
}
