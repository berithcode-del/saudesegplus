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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const allowed_origins_1 = require("../security/allowed-origins");
let SupportGateway = class SupportGateway {
    server;
    handleConnection(client) {
        console.log(`[Support WS] Connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[Support WS] Disconnected: ${client.id}`);
    }
    handleJoinTicket(client, data) {
        client.join(`ticket:${data.ticketId}`);
        return { event: 'joined', data: { room: `ticket:${data.ticketId}` } };
    }
    handleLeaveTicket(client, data) {
        client.leave(`ticket:${data.ticketId}`);
    }
    handleJoinAdmin(client) {
        const user = client.data.user;
        if (user?.role !== 'ADMIN') {
            return { event: 'error', data: { message: 'Forbidden' } };
        }
        client.join('support:admin');
        return { event: 'joined_admin' };
    }
    handleLeaveAdmin(client) {
        client.leave('support:admin');
    }
    emitNewMessage(ticketId, message) {
        const payload = { ticketId, message };
        this.server.to(`ticket:${ticketId}`).emit('new_message', payload);
        this.server.to('support:admin').emit('new_message', payload);
    }
    emitNewTicket(ticket) {
        this.server.to('support:admin').emit('new_ticket', ticket);
    }
    emitTicketUpdated(ticketId, status) {
        const payload = { ticketId, status };
        this.server.to(`ticket:${ticketId}`).emit('ticket_updated', payload);
        this.server.to('support:admin').emit('ticket_updated', payload);
    }
};
exports.SupportGateway = SupportGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SupportGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_ticket'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SupportGateway.prototype, "handleJoinTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_ticket'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SupportGateway.prototype, "handleLeaveTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_admin'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SupportGateway.prototype, "handleJoinAdmin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_admin'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SupportGateway.prototype, "handleLeaveAdmin", null);
exports.SupportGateway = SupportGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: (0, allowed_origins_1.getAllowedOrigins)() },
        namespace: '/support',
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], SupportGateway);
//# sourceMappingURL=support.gateway.js.map