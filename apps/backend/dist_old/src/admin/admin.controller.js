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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const update_admin_profiles_dto_1 = require("./dto/update-admin-profiles.dto");
const client_1 = require("@prisma/client");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getCompanies(status) {
        return this.adminService.getCompanies(status);
    }
    async getCompaniesPendingApproval() {
        return this.adminService.getCompaniesPendingApproval();
    }
    async getCompany(id) {
        return this.adminService.getCompanyById(id);
    }
    async updateCompany(id, body) {
        return this.adminService.updateCompany(id, body);
    }
    async deleteCompany(id) {
        return this.adminService.deleteCompany(id);
    }
    async getClinics() {
        return this.adminService.getClinics();
    }
    async getClinic(id) {
        return this.adminService.getClinicById(id);
    }
    async createClinic(body) {
        return this.adminService.createClinic(body);
    }
    async updateClinic(id, body) {
        return this.adminService.updateClinic(id, body);
    }
    async deleteClinic(id) {
        return this.adminService.deleteClinic(id);
    }
    async setClinicAsMatriz(id, body) {
        return this.adminService.setClinicAsMatriz(id, body.setAsMatriz);
    }
    async getDoctors() {
        return this.adminService.getDoctors();
    }
    async getDoctor(id) {
        return this.adminService.getDoctorById(id);
    }
    async createDoctor(body) {
        return this.adminService.createDoctor(body);
    }
    async updateDoctor(id, body) {
        return this.adminService.updateDoctor(id, body);
    }
    async verifyDoctor(id) {
        return this.adminService.verifyDoctor(id);
    }
    async deleteDoctor(id) {
        return this.adminService.deleteDoctor(id);
    }
    async getStats() {
        return this.adminService.getStats();
    }
    async approveCompanyDocumentation(companyId, body) {
        return this.adminService.approveCompanyDocumentation(companyId, body.approvedBy);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('companies'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Get)('companies/pending-approval'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCompaniesPendingApproval", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_profiles_dto_1.UpdateAdminCompanyDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Delete)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCompany", null);
__decorate([
    (0, common_1.Get)('clinics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClinics", null);
__decorate([
    (0, common_1.Get)('clinics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClinic", null);
__decorate([
    (0, common_1.Post)('clinics'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createClinic", null);
__decorate([
    (0, common_1.Patch)('clinics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_profiles_dto_1.UpdateAdminClinicDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClinic", null);
__decorate([
    (0, common_1.Delete)('clinics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClinic", null);
__decorate([
    (0, common_1.Patch)('clinics/:id/matriz'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_profiles_dto_1.SetMatrizClinicDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setClinicAsMatriz", null);
__decorate([
    (0, common_1.Get)('doctors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDoctors", null);
__decorate([
    (0, common_1.Get)('doctors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDoctor", null);
__decorate([
    (0, common_1.Post)('doctors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createDoctor", null);
__decorate([
    (0, common_1.Patch)('doctors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_profiles_dto_1.UpdateAdminDoctorDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateDoctor", null);
__decorate([
    (0, common_1.Post)('doctors/:id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyDoctor", null);
__decorate([
    (0, common_1.Delete)('doctors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteDoctor", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('companies/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveCompanyDocumentation", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('api/admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map