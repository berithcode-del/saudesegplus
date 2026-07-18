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
exports.CompanyGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const allowed_origins_1 = require("../security/allowed-origins");
let CompanyGateway = class CompanyGateway {
    server;
    companyRooms = new Map();
    handleConnection(client) {
        console.log(`[CompanyGateway] Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[CompanyGateway] Client disconnected: ${client.id}`);
        this.companyRooms.forEach((clients, roomId) => {
            if (clients.has(client.id)) {
                clients.delete(client.id);
                if (clients.size === 0)
                    this.companyRooms.delete(roomId);
            }
        });
    }
    handleJoinCompany(client, data) {
        const user = client.data.user;
        if (user?.role !== 'ADMIN' && user?.profileId !== data.companyId) {
            return { event: 'error', data: { message: 'Forbidden' } };
        }
        const room = `company:${data.companyId}`;
        client.join(room);
        if (!this.companyRooms.has(room)) {
            this.companyRooms.set(room, new Set());
        }
        this.companyRooms.get(room).add(client.id);
        console.log(`[CompanyGateway] Client ${client.id} joined room ${room}`);
        return { event: 'joined', data: { room } };
    }
    handleLeaveCompany(client, data) {
        const room = `company:${data.companyId}`;
        client.leave(room);
        this.companyRooms.get(room)?.delete(client.id);
        return { event: 'left', data: { room } };
    }
    emitTimelineUpdate(companyId, payload) {
        try {
            this.server.to(`company:${companyId}`).emit('timeline_update', payload);
        }
        catch (error) {
            console.error(`[CompanyGateway] Erro ao emitir timeline_update para ${companyId}:`, error);
        }
    }
    emitInviteStatusChange(companyId, payload) {
        try {
            this.server.to(`company:${companyId}`).emit('invite_status_change', payload);
        }
        catch (error) {
            console.error(`[CompanyGateway] Erro ao emitir invite_status_change para ${companyId}:`, error);
        }
    }
    emitDashboardStats(companyId, stats) {
        try {
            this.server.to(`company:${companyId}`).emit('dashboard_stats', stats);
        }
        catch (error) {
            console.error(`[CompanyGateway] Erro ao emitir dashboard_stats para ${companyId}:`, error);
        }
    }
    emitAsoExpirationAlert(companyId, payload) {
        try {
            this.server.to(`company:${companyId}`).emit('aso_expiration_alert', payload);
        }
        catch (error) {
            console.error(`[CompanyGateway] Erro ao emitir aso_expiration_alert para ${companyId}:`, error);
        }
    }
};
exports.CompanyGateway = CompanyGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CompanyGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_company'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CompanyGateway.prototype, "handleJoinCompany", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_company'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CompanyGateway.prototype, "handleLeaveCompany", null);
exports.CompanyGateway = CompanyGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: (0, allowed_origins_1.getAllowedOrigins)() },
        namespace: '/company',
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], CompanyGateway);
//# sourceMappingURL=company.gateway.js.map