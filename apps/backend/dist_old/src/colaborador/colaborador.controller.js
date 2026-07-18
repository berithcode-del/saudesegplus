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
exports.ColaboradorController = void 0;
const common_1 = require("@nestjs/common");
const colaborador_service_1 = require("./colaborador.service");
const validate_invite_dto_1 = require("./dto/validate-invite.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const patient_scope_guard_1 = require("../auth/patient-scope.guard");
const throttler_1 = require("@nestjs/throttler");
let ColaboradorController = class ColaboradorController {
    colaboradorService;
    constructor(colaboradorService) {
        this.colaboradorService = colaboradorService;
    }
    async validateInviteAndRegister(dto) {
        const result = await this.colaboradorService.validateInviteAndRegister(dto);
        return { success: true, data: result };
    }
    async listSolicitacoes(patientId) {
        const solicitacoes = await this.colaboradorService.listSolicitacoes(patientId);
        return { success: true, data: solicitacoes };
    }
};
exports.ColaboradorController = ColaboradorController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_invite_dto_1.ValidateInviteDto]),
    __metadata("design:returntype", Promise)
], ColaboradorController.prototype, "validateInviteAndRegister", null);
__decorate([
    (0, common_1.Get)(':id/solicitacoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'PATIENT'),
    (0, common_1.UseGuards)(patient_scope_guard_1.PatientScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ColaboradorController.prototype, "listSolicitacoes", null);
exports.ColaboradorController = ColaboradorController = __decorate([
    (0, common_1.Controller)('api/colaboradores'),
    __metadata("design:paramtypes", [colaborador_service_1.ColaboradorService])
], ColaboradorController);
//# sourceMappingURL=colaborador.controller.js.map