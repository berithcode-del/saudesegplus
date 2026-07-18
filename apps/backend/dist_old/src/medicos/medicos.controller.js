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
exports.MedicosController = void 0;
const common_1 = require("@nestjs/common");
const medicos_service_1 = require("./medicos.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const update_doctor_profile_dto_1 = require("./dto/update-doctor-profile.dto");
let MedicosController = class MedicosController {
    medicosService;
    constructor(medicosService) {
        this.medicosService = medicosService;
    }
    async list(search, city, state, page, limit) {
        const data = await this.medicosService.list({ search, city, state }, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        return { success: true, data };
    }
    async getProfile(doctorId) {
        const data = await this.medicosService.getProfile(doctorId);
        return { success: true, data };
    }
    async listSolicitacoes(doctorId, startDate, endDate) {
        const data = await this.medicosService.listSolicitacoes(doctorId, startDate, endDate);
        return { success: true, data };
    }
    async updateProfile(req, doctorId, body) {
        const data = await this.medicosService.updateProfile(req.user.sub, doctorId, body);
        return { success: true, data };
    }
    async setSignaturePin(req, body) {
        return this.medicosService.setSignaturePin(req.user.sub, body.currentPassword, body.pin);
    }
};
exports.MedicosController = MedicosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MedicosController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/perfil'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MedicosController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/solicitacoes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MedicosController.prototype, "listSolicitacoes", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/perfil'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_doctor_profile_dto_1.UpdateDoctorProfileDto]),
    __metadata("design:returntype", Promise)
], MedicosController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('signature-pin'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MedicosController.prototype, "setSignaturePin", null);
exports.MedicosController = MedicosController = __decorate([
    (0, common_1.Controller)('api/medicos'),
    __metadata("design:paramtypes", [medicos_service_1.MedicosService])
], MedicosController);
//# sourceMappingURL=medicos.controller.js.map