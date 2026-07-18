"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamRequestModule = void 0;
const common_1 = require("@nestjs/common");
const exam_request_controller_1 = require("./exam-request.controller");
const exam_request_service_1 = require("./exam-request.service");
const prisma_service_1 = require("../prisma.service");
const company_module_1 = require("../company/company.module");
const presence_module_1 = require("../presence/presence.module");
const upload_module_1 = require("../upload/upload.module");
let ExamRequestModule = class ExamRequestModule {
};
exports.ExamRequestModule = ExamRequestModule;
exports.ExamRequestModule = ExamRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [company_module_1.CompanyModule, presence_module_1.PresenceModule, upload_module_1.UploadModule],
        controllers: [exam_request_controller_1.ExamRequestController],
        providers: [exam_request_service_1.ExamRequestService, prisma_service_1.PrismaService],
    })
], ExamRequestModule);
//# sourceMappingURL=exam-request.module.js.map