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
exports.AnamneseController = void 0;
const common_1 = require("@nestjs/common");
const anamnese_service_1 = require("./anamnese.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AnamneseController = class AnamneseController {
    anamneseService;
    constructor(anamneseService) {
        this.anamneseService = anamneseService;
    }
    async findByPatient(patientId) {
        const data = await this.anamneseService.findByPatient(patientId);
        return { success: true, data };
    }
    async upsert(patientId, body) {
        const data = await this.anamneseService.upsert(patientId, body);
        return { success: true, data };
    }
};
exports.AnamneseController = AnamneseController;
__decorate([
    (0, common_1.Get)(':patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnamneseController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Put)(':patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnamneseController.prototype, "upsert", null);
exports.AnamneseController = AnamneseController = __decorate([
    (0, common_1.Controller)('api/anamnese'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR'),
    __metadata("design:paramtypes", [anamnese_service_1.AnamneseService])
], AnamneseController);
//# sourceMappingURL=anamnese.controller.js.map