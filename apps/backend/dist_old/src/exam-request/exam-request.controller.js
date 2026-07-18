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
exports.ExamRequestController = void 0;
const common_1 = require("@nestjs/common");
const exam_request_service_1 = require("./exam-request.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ExamRequestController = class ExamRequestController {
    examRequestService;
    constructor(examRequestService) {
        this.examRequestService = examRequestService;
    }
    async list(req, status, companyId, patientId, page, limit) {
        const data = await this.examRequestService.list({ status, companyId, patientId }, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, req.user);
        return { success: true, data };
    }
    async findOne(id, req) {
        const data = await this.examRequestService.findOne(id, req.user);
        return { success: true, data };
    }
    async getAttachment(resultId, req, response) {
        const file = await this.examRequestService.getResultAttachment(resultId, req.user);
        response.setHeader('Content-Type', file.fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
        response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
        response.send(file.buffer);
    }
    async update(id, body, req) {
        await this.examRequestService.assertAccess(id, req.user, true);
        const data = await this.examRequestService.updateStatus(id, body);
        return { success: true, data };
    }
};
exports.ExamRequestController = ExamRequestController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('companyId')),
    __param(3, (0, common_1.Query)('patientId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ExamRequestController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('results/:resultId/attachment'),
    __param(0, (0, common_1.Param)('resultId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExamRequestController.prototype, "getAttachment", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExamRequestController.prototype, "update", null);
exports.ExamRequestController = ExamRequestController = __decorate([
    (0, common_1.Controller)('api/solicitacoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR'),
    __metadata("design:paramtypes", [exam_request_service_1.ExamRequestService])
], ExamRequestController);
//# sourceMappingURL=exam-request.controller.js.map