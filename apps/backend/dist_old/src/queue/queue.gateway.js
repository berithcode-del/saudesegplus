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
exports.QueueGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const allowed_origins_1 = require("../security/allowed-origins");
let QueueGateway = class QueueGateway {
    server;
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    emitQueueUpdate(event, payload) {
        this.server.emit(event, payload);
    }
    emitProcessUpdate(processId, event, payload) {
        this.server.to(`process:${processId}`).emit(event, payload);
        this.server.emit(event, payload);
    }
    handleJoinProcess(data, client) {
        if (!data?.processId)
            return;
        const user = client.data.user;
        if (user?.role === 'PORTAL' && user.processId !== data.processId)
            return;
        client.join(`process:${data.processId}`);
    }
    handleDoctorViewingPatient(data, client) {
        if (!data?.processId)
            return;
        const user = client.data.user;
        if (user?.role !== 'DOCTOR' || user.profileId !== data.doctorId)
            return;
        this.emitProcessUpdate(data.processId, 'doctor_viewing_patient', {
            processId: data.processId,
            doctorId: data.doctorId ?? null,
            viewedAt: new Date().toISOString(),
        });
    }
    handleDoctorOnline(data, client) {
        const user = client.data.user;
        if (user?.role !== 'DOCTOR' || user.profileId !== data.doctorId)
            return;
        this.server.emit('doctor_status', { doctorId: data.doctorId, status: 'online' });
    }
};
exports.QueueGateway = QueueGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], QueueGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_process'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], QueueGateway.prototype, "handleJoinProcess", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('doctor_viewing_patient'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], QueueGateway.prototype, "handleDoctorViewingPatient", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('doctor_online'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], QueueGateway.prototype, "handleDoctorOnline", null);
exports.QueueGateway = QueueGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (0, allowed_origins_1.getAllowedOrigins)(),
        },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], QueueGateway);
//# sourceMappingURL=queue.gateway.js.map