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
exports.PortalController = void 0;
const common_1 = require("@nestjs/common");
const portal_service_1 = require("./portal.service");
const portal_session_guard_1 = require("./portal-session.guard");
const auth_portal_dto_1 = require("./dto/auth-portal.dto");
const confirmar_dados_dto_1 = require("./dto/confirmar-dados.dto");
const questionario_dto_1 = require("./dto/questionario.dto");
const enviar_documento_dto_1 = require("./dto/enviar-documento.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const presence_service_1 = require("../presence/presence.service");
const throttler_1 = require("@nestjs/throttler");
let PortalController = class PortalController {
    portalService;
    presenceService;
    constructor(portalService, presenceService) {
        this.portalService = portalService;
        this.presenceService = presenceService;
    }
    async heartbeat(req) {
        const user = req.user;
        this.presenceService.recordHeartbeat(user.processId);
        return { success: true };
    }
    async preview(token) {
        return this.portalService.preview(token);
    }
    async auth(dto) {
        return this.portalService.auth(dto.token, dto.cpf, dto.birthDate);
    }
    async getProcesso(req) {
        const user = req.user;
        return this.portalService.getProcesso(user.patientId, user.processId);
    }
    async confirmarDados(req, dto) {
        const user = req.user;
        return this.portalService.confirmarDados(user.processId, user.patientId, dto.phone, dto.email);
    }
    async getStatusDocumentos(req) {
        const user = req.user;
        return this.portalService.getStatusDocumentos(user.patientId, user.processId);
    }
    async enviarDocumento(req, dto) {
        const user = req.user;
        return this.portalService.enviarDocumento(user.processId, user.patientId, dto.tipo, dto.fileUrl);
    }
    async responderQuestionario(req, dto) {
        const user = req.user;
        return this.portalService.responderQuestionario(user.processId, user.patientId, dto);
    }
    async getAso(req, response) {
        const user = req.user;
        const file = await this.portalService.getAsoFile(user.processId, user.patientId);
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        response.send(file.buffer);
    }
};
exports.PortalController = PortalController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('heartbeat'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "heartbeat", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('preview/:token'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "preview", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('auth'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_portal_dto_1.AuthPortalDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "auth", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('processo'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getProcesso", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('confirmar-dados'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, confirmar_dados_dto_1.ConfirmarDadosDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "confirmarDados", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('documentos'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getStatusDocumentos", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('documentos'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, enviar_documento_dto_1.EnviarDocumentoDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "enviarDocumento", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('questionario'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, questionario_dto_1.QuestionarioDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "responderQuestionario", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('aso'),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getAso", null);
exports.PortalController = PortalController = __decorate([
    (0, common_1.Controller)('api/portal'),
    __metadata("design:paramtypes", [portal_service_1.PortalService,
        presence_service_1.PresenceService])
], PortalController);
//# sourceMappingURL=portal.controller.js.map