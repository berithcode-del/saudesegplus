"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModule = void 0;
const common_1 = require("@nestjs/common");
const company_controller_1 = require("./company.controller");
const company_service_1 = require("./company.service");
const company_gateway_1 = require("./company.gateway");
const prisma_service_1 = require("../prisma.service");
const mail_module_1 = require("../mail/mail.module");
const auth_module_1 = require("../auth/auth.module");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const company_invite_scope_guard_1 = require("../auth/company-invite-scope.guard");
const config_1 = require("@nestjs/config");
const supabase_storage_service_1 = require("../upload/supabase-storage.service");
let CompanyModule = class CompanyModule {
};
exports.CompanyModule = CompanyModule;
exports.CompanyModule = CompanyModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule, auth_module_1.AuthModule, config_1.ConfigModule],
        controllers: [company_controller_1.CompanyController],
        providers: [company_service_1.CompanyService, company_gateway_1.CompanyGateway, prisma_service_1.PrismaService, ws_jwt_guard_1.WsJwtGuard, company_invite_scope_guard_1.CompanyInviteScopeGuard, supabase_storage_service_1.SupabaseStorageService],
        exports: [company_service_1.CompanyService, company_gateway_1.CompanyGateway, ws_jwt_guard_1.WsJwtGuard],
    })
], CompanyModule);
//# sourceMappingURL=company.module.js.map