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
exports.CompanyController = void 0;
const common_1 = require("@nestjs/common");
const company_service_1 = require("./company.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const create_invite_dto_1 = require("./dto/create-invite.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const company_scope_guard_1 = require("../auth/company-scope.guard");
const company_invite_scope_guard_1 = require("../auth/company-invite-scope.guard");
const throttler_1 = require("@nestjs/throttler");
let CompanyController = class CompanyController {
    companyService;
    constructor(companyService) {
        this.companyService = companyService;
    }
    async createCompany(dto) {
        try {
            const result = await this.companyService.createCompany(dto);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async listCompanies() {
        try {
            const companies = await this.companyService.listCompanies();
            return { success: true, data: companies };
        }
        catch (error) {
            throw error;
        }
    }
    async listAllInvites() {
        try {
            const invites = await this.companyService.listInvitesForAllCompanies();
            return { success: true, data: invites };
        }
        catch (error) {
            throw error;
        }
    }
    async statusCheck(id) {
        try {
            const result = await this.companyService.getStatusCheck(id);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async getInviteTimeline(inviteId) {
        try {
            const timeline = await this.companyService.getInviteTimeline(inviteId);
            return { success: true, data: timeline };
        }
        catch (error) {
            throw error;
        }
    }
    async searchInvite(cpf, req) {
        try {
            if (!cpf)
                throw new Error('CPF é obrigatório');
            const invite = await this.companyService.findInviteByCpf(cpf, req.user);
            if (!invite)
                return { success: false, message: 'Convite não encontrado' };
            return { success: true, data: invite };
        }
        catch (error) {
            throw error;
        }
    }
    async getCompany(id) {
        try {
            const company = await this.companyService.getCompany(id);
            return { success: true, data: company };
        }
        catch (error) {
            throw error;
        }
    }
    async updateCompany(id, dto) {
        try {
            const company = await this.companyService.updateCompany(id, dto);
            return { success: true, data: company };
        }
        catch (error) {
            throw error;
        }
    }
    async updateStatus(id, body) {
        try {
            const company = await this.companyService.updateCompanyStatus(id, body.status);
            return { success: true, data: company };
        }
        catch (error) {
            throw error;
        }
    }
    async getDashboard(id) {
        try {
            const stats = await this.companyService.getDashboardStats(id);
            return { success: true, data: stats };
        }
        catch (error) {
            throw error;
        }
    }
    async createInvite(companyId, dto) {
        try {
            const invite = await this.companyService.createInvite(companyId, dto);
            return { success: true, data: invite };
        }
        catch (error) {
            throw error;
        }
    }
    async cancelInvite(id) {
        try {
            await this.companyService.cancelInvite(id);
            return { success: true };
        }
        catch (error) {
            throw error;
        }
    }
    async listInvites(companyId) {
        try {
            const invites = await this.companyService.listInvites(companyId);
            return { success: true, data: invites };
        }
        catch (error) {
            throw error;
        }
    }
    async listActiveAsos(companyId) {
        try {
            const asos = await this.companyService.listActiveAsos(companyId);
            return { success: true, data: asos };
        }
        catch (error) {
            throw error;
        }
    }
    async relatorio(id, res, de, ate) {
        const dados = await this.companyService.gerarRelatorio(id, de, ate);
        const header = 'Nome;CPF;CBO;Tipo Exame;Data;Decisao ASO;Validade ASO\n';
        const csv = header + dados.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-${id}.csv"`);
        res.send('\uFEFF' + csv);
    }
    async getAsoFile(companyId, asoId, response) {
        const file = await this.companyService.getAsoPdf(companyId, asoId);
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
        response.send(file.buffer);
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 3600000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "listCompanies", null);
__decorate([
    (0, common_1.Get)('solicitacoes'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "listAllInvites", null);
__decorate([
    (0, common_1.Get)(':id/status-check'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "statusCheck", null);
__decorate([
    (0, common_1.Get)('invite/:inviteId/timeline'),
    (0, common_1.UseGuards)(company_invite_scope_guard_1.CompanyInviteScopeGuard),
    __param(0, (0, common_1.Param)('inviteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getInviteTimeline", null);
__decorate([
    (0, common_1.Get)('invite/search'),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Query)('cpf')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "searchInvite", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getCompany", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_invite_dto_1.CreateInviteDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Delete)('invite/:id'),
    (0, common_1.UseGuards)(company_invite_scope_guard_1.CompanyInviteScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "cancelInvite", null);
__decorate([
    (0, common_1.Get)(':id/invites'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "listInvites", null);
__decorate([
    (0, common_1.Get)(':id/asos'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "listActiveAsos", null);
__decorate([
    (0, common_1.Get)(':id/relatorio'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('de')),
    __param(3, (0, common_1.Query)('ate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "relatorio", null);
__decorate([
    (0, common_1.Get)(':id/asos/:asoId/file'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('asoId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getAsoFile", null);
exports.CompanyController = CompanyController = __decorate([
    (0, common_1.Controller)('api/company'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN'),
    __metadata("design:paramtypes", [company_service_1.CompanyService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map