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
exports.FinancialController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const financial_service_1 = require("./financial.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let FinancialController = class FinancialController {
    financialService;
    constructor(financialService) {
        this.financialService = financialService;
    }
    async getConfig() {
        const data = await this.financialService.getConfig();
        return { success: true, data };
    }
    async updateConfig(body) {
        const data = await this.financialService.updateConfig(body);
        return { success: true, data };
    }
    async listServicePrices() {
        const data = await this.financialService.listServicePrices();
        return { success: true, data };
    }
    async createServicePrice(body) {
        const data = await this.financialService.createServicePrice(body);
        return { success: true, data };
    }
    async updateServicePrice(id, body) {
        const data = await this.financialService.updateServicePrice(id, body);
        return { success: true, data };
    }
    async deleteServicePrice(id) {
        await this.financialService.deleteServicePrice(id);
        return { success: true };
    }
    async listExamItemPrices() {
        const data = await this.financialService.listExamItemPrices();
        return { success: true, data };
    }
    async createExamItemPrice(body) {
        const data = await this.financialService.createExamItemPrice(body);
        return { success: true, data };
    }
    async updateExamItemPrice(id, body) {
        const data = await this.financialService.updateExamItemPrice(id, body);
        return { success: true, data };
    }
    async quote(body) {
        const data = await this.financialService.quote(body);
        return { success: true, data };
    }
    async createPayment(body, req) {
        const input = { ...body };
        if (req.user.role === 'COMPANY_ADMIN') {
            if (input.flow !== client_1.PaymentFlow.COMPANY_INVITE) {
                throw new common_1.ForbiddenException('Empresa pode criar apenas pagamentos de convites.');
            }
            input.companyId = req.user.profileId ?? undefined;
            input.clinicId = undefined;
        }
        if (req.user.role === 'CLINIC' || req.user.role === 'OPERATOR') {
            if (input.flow !== client_1.PaymentFlow.CLINIC_WALK_IN) {
                throw new common_1.ForbiddenException('Clinica pode criar apenas pagamentos presenciais.');
            }
            input.clinicId =
                (await this.financialService.resolveClinicId(req.user.role, req.user.profileId)) ?? undefined;
        }
        const data = await this.financialService.createPayment(input);
        return { success: true, data };
    }
    async confirmPayment(id, body, req) {
        await this.financialService.assertPaymentAccess(id, req.user);
        const data = await this.financialService.confirmPayment(id, body.method);
        return { success: true, data };
    }
    async listTransactions(query, req) {
        const scopedClinicId = await this.financialService.resolveClinicId(req.user.role, req.user.profileId);
        if (req.user.role !== 'ADMIN' && !scopedClinicId) {
            throw new common_1.ForbiddenException('Clinica da conta autenticada nao identificada.');
        }
        const data = await this.financialService.listTransactions({
            type: query.type,
            category: query.category,
            status: query.status,
            clinicId: scopedClinicId ?? query.clinicId,
            doctorId: query.doctorId,
            companyId: query.companyId,
            month: query.month !== undefined ? Number(query.month) : undefined,
            year: query.year !== undefined ? Number(query.year) : undefined,
        });
        return { success: true, data };
    }
    async createTransaction(body) {
        const data = await this.financialService.createTransaction(body);
        return { success: true, data };
    }
    async markAsPaid(id) {
        const data = await this.financialService.markAsPaid(id);
        return { success: true, data };
    }
    async getSummary(month, year) {
        const data = await this.financialService.getSummary(month !== undefined ? Number(month) : undefined, year !== undefined ? Number(year) : undefined);
        return { success: true, data };
    }
};
exports.FinancialController = FinancialController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('service-prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "listServicePrices", null);
__decorate([
    (0, common_1.Post)('service-prices'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "createServicePrice", null);
__decorate([
    (0, common_1.Patch)('service-prices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "updateServicePrice", null);
__decorate([
    (0, common_1.Delete)('service-prices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "deleteServicePrice", null);
__decorate([
    (0, common_1.Get)('exam-item-prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "listExamItemPrices", null);
__decorate([
    (0, common_1.Post)('exam-item-prices'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "createExamItemPrice", null);
__decorate([
    (0, common_1.Patch)('exam-item-prices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "updateExamItemPrice", null);
__decorate([
    (0, common_1.Post)('quotes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "quote", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Patch)('payments/:id/confirm'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Post)('transactions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Patch)('transactions/:id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "getSummary", null);
exports.FinancialController = FinancialController = __decorate([
    (0, common_1.Controller)('api/financial'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [financial_service_1.FinancialService])
], FinancialController);
//# sourceMappingURL=financial.controller.js.map