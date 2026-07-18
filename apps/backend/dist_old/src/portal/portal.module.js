"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const jwt_secret_1 = require("../auth/jwt-secret");
const portal_controller_1 = require("./portal.controller");
const portal_service_1 = require("./portal.service");
const portal_session_guard_1 = require("./portal-session.guard");
const prisma_service_1 = require("../prisma.service");
const queue_module_1 = require("../queue/queue.module");
const company_module_1 = require("../company/company.module");
const presence_module_1 = require("../presence/presence.module");
const config_1 = require("@nestjs/config");
const supabase_storage_service_1 = require("../upload/supabase-storage.service");
let PortalModule = class PortalModule {
};
exports.PortalModule = PortalModule;
exports.PortalModule = PortalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: (0, jwt_secret_1.getJwtSecret)(),
                signOptions: { expiresIn: (0, jwt_secret_1.getPortalJwtExpiresIn)() },
            }),
            queue_module_1.QueueModule,
            company_module_1.CompanyModule,
            presence_module_1.PresenceModule,
            config_1.ConfigModule,
        ],
        controllers: [portal_controller_1.PortalController],
        providers: [portal_service_1.PortalService, portal_session_guard_1.PortalSessionGuard, prisma_service_1.PrismaService, supabase_storage_service_1.SupabaseStorageService],
        exports: [portal_session_guard_1.PortalSessionGuard, jwt_1.JwtModule],
    })
], PortalModule);
//# sourceMappingURL=portal.module.js.map