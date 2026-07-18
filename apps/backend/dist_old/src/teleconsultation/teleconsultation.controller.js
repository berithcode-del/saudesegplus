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
exports.TeleconsultationController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const queue_gateway_1 = require("../queue/queue.gateway");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let TeleconsultationController = class TeleconsultationController {
    prisma;
    queueGateway;
    constructor(prisma, queueGateway) {
        this.prisma = prisma;
        this.queueGateway = queueGateway;
    }
    async createRoom(req, body) {
        const user = req.user;
        const doctorId = user?.role === 'DOCTOR' && user.profileId ? user.profileId : null;
        if (!body.examRequestId || !doctorId) {
            throw new common_1.BadRequestException('Nao foi possivel identificar o medico autenticado.');
        }
        const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            throw new common_1.BadRequestException('Medico nao encontrado. Verifique se o perfil medico esta correto.');
        }
        const examRequest = await this.prisma.examRequest.findUnique({
            where: { id: body.examRequestId },
            include: { invite: true },
        });
        if (!examRequest)
            throw new common_1.BadRequestException('Solicitacao de exame nao encontrada.');
        const existingRoom = await this.prisma.teleconsultation.findFirst({
            where: { requestId: body.examRequestId },
        });
        if (existingRoom) {
            const videoSessionId = this.withEmbeddedJitsiConfig(existingRoom.videoSessionId);
            const hostRoomUrl = this.withEmbeddedJitsiConfig(existingRoom.hostRoomUrl);
            const roomForReturn = videoSessionId !== existingRoom.videoSessionId || hostRoomUrl !== existingRoom.hostRoomUrl
                ? await this.prisma.teleconsultation.update({
                    where: { id: existingRoom.id },
                    data: { videoSessionId, hostRoomUrl },
                })
                : existingRoom;
            if (examRequest.status !== 'EM_ATENDIMENTO_MEDICO') {
                await this.prisma.examRequest.update({
                    where: { id: body.examRequestId },
                    data: { status: 'EM_ATENDIMENTO_MEDICO' },
                });
            }
            if (examRequest.inviteId) {
                const existingEvent = await this.prisma.examTimelineEvent.findFirst({
                    where: {
                        examRequestId: body.examRequestId,
                        eventType: 'TELECONSULTA_INICIADA',
                    },
                });
                if (!existingEvent) {
                    await this.prisma.examTimelineEvent.create({
                        data: {
                            inviteId: examRequest.inviteId,
                            examRequestId: body.examRequestId,
                            eventType: 'TELECONSULTA_INICIADA',
                            metadata: JSON.stringify({ doctorId, roomId: existingRoom.id }),
                        },
                    });
                }
            }
            this.emitTeleconsultationStarted(body.examRequestId, roomForReturn);
            return { success: true, data: roomForReturn };
        }
        const uniqueHash = Math.random().toString(36).substring(2, 10);
        const roomName = `SaudeSeg-Consulta-${body.examRequestId.slice(0, 8)}-${uniqueHash}`;
        const videoSessionId = this.withEmbeddedJitsiConfig(`https://meet.jit.si/${roomName}`);
        const hostRoomUrl = videoSessionId;
        const teleconsultation = await this.prisma.teleconsultation.create({
            data: {
                requestId: body.examRequestId,
                doctorId,
                videoSessionId,
                hostRoomUrl,
                startedAt: new Date(),
            },
        });
        await this.prisma.examRequest.update({
            where: { id: body.examRequestId },
            data: { status: 'EM_ATENDIMENTO_MEDICO' },
        });
        if (examRequest.inviteId) {
            await this.prisma.examTimelineEvent.create({
                data: {
                    inviteId: examRequest.inviteId,
                    examRequestId: body.examRequestId,
                    eventType: 'TELECONSULTA_INICIADA',
                    metadata: JSON.stringify({ doctorId, roomId: teleconsultation.id }),
                },
            });
        }
        this.emitTeleconsultationStarted(body.examRequestId, teleconsultation);
        return { success: true, data: teleconsultation };
    }
    emitTeleconsultationStarted(examRequestId, teleconsultation) {
        this.queueGateway.emitProcessUpdate(examRequestId, 'teleconsulta_iniciada', {
            examRequestId,
            teleconsultationId: teleconsultation.id,
            linkSala: teleconsultation.videoSessionId,
            hostRoomUrl: teleconsultation.hostRoomUrl,
            startedAt: teleconsultation.startedAt.toISOString(),
        });
    }
    withEmbeddedJitsiConfig(url) {
        if (!url)
            return null;
        const [base, hash = ''] = url.split('#');
        const params = new URLSearchParams(hash);
        params.set('config.prejoinPageEnabled', 'false');
        params.set('config.disableDeepLinking', 'true');
        params.set('interfaceConfig.MOBILE_APP_PROMO', 'false');
        return `${base}#${params.toString()}`;
    }
};
exports.TeleconsultationController = TeleconsultationController;
__decorate([
    (0, common_1.Post)('create-room'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeleconsultationController.prototype, "createRoom", null);
exports.TeleconsultationController = TeleconsultationController = __decorate([
    (0, common_1.Controller)('api/teleconsultation'),
    (0, roles_decorator_1.Roles)('DOCTOR'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_gateway_1.QueueGateway])
], TeleconsultationController);
//# sourceMappingURL=teleconsultation.controller.js.map