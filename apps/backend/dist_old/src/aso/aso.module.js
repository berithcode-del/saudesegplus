"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsoModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const aso_controller_1 = require("./aso.controller");
const aso_service_1 = require("./aso.service");
const mail_module_1 = require("../mail/mail.module");
const financial_module_1 = require("../financial/financial.module");
const upload_module_1 = require("../upload/upload.module");
let AsoModule = class AsoModule {
};
exports.AsoModule = AsoModule;
exports.AsoModule = AsoModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule, financial_module_1.FinancialModule, upload_module_1.UploadModule],
        controllers: [aso_controller_1.AsoController],
        providers: [aso_service_1.AsoService, prisma_service_1.PrismaService],
    })
], AsoModule);
//# sourceMappingURL=aso.module.js.map