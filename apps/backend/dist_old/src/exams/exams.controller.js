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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const throttler_1 = require("@nestjs/throttler");
let ExamsController = class ExamsController {
    examsService;
    constructor(examsService) {
        this.examsService = examsService;
    }
    async listTypes() {
        const data = await this.examsService.findTypes();
        return { success: true, data };
    }
    async getRequired(cboCode) {
        const data = await this.examsService.findRequiredByCbo(cboCode);
        return { success: true, data };
    }
    async searchCbo(query) {
        const data = await this.examsService.searchByFunctionName(query);
        return { success: true, data };
    }
    async create(body, req) {
        const items = body.results ?? [
            {
                examType: body.examType,
                valueJson: body.valueJson,
                attachmentUrl: body.attachmentUrl,
            },
        ];
        const created = await Promise.all(items.map((item) => this.examsService.createExam(body.examRequestId, item.examType, item.valueJson, item.attachmentUrl, req.user, body.operatorId)));
        return { success: true, data: created };
    }
    async sendToQueue(examRequestId) {
        await this.examsService.sendToMedicalQueue(examRequestId);
        return { success: true };
    }
    async createPatient(body) {
        const result = await this.examsService.createPatient(body);
        return { success: true, data: result };
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Get)('types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "listTypes", null);
__decorate([
    (0, common_1.Get)('required'),
    __param(0, (0, common_1.Query)('cboCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getRequired", null);
__decorate([
    (0, common_1.Get)('cbo-search'),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60000 } }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "searchCbo", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/send-to-queue'),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "sendToQueue", null);
__decorate([
    (0, common_1.Post)('create-patient'),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "createPatient", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)('api/exams'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR'),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map