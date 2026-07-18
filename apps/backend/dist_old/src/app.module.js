"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const queue_module_1 = require("./queue/queue.module");
const exams_module_1 = require("./exams/exams.module");
const signature_module_1 = require("./signature/signature.module");
const aso_module_1 = require("./aso/aso.module");
const company_module_1 = require("./company/company.module");
const colaborador_module_1 = require("./colaborador/colaborador.module");
const exam_request_module_1 = require("./exam-request/exam-request.module");
const medicos_module_1 = require("./medicos/medicos.module");
const anamnese_module_1 = require("./anamnese/anamnese.module");
const upload_module_1 = require("./upload/upload.module");
const auth_module_1 = require("./auth/auth.module");
const portal_module_1 = require("./portal/portal.module");
const admin_module_1 = require("./admin/admin.module");
const mail_module_1 = require("./mail/mail.module");
const jobs_module_1 = require("./jobs/jobs.module");
const calendar_module_1 = require("./calendar/calendar.module");
const teleconsultation_module_1 = require("./teleconsultation/teleconsultation.module");
const financial_module_1 = require("./financial/financial.module");
const support_module_1 = require("./support/support.module");
const clinic_profile_module_1 = require("./clinic-profile/clinic-profile.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
            queue_module_1.QueueModule,
            exams_module_1.ExamsModule,
            signature_module_1.SignatureModule,
            aso_module_1.AsoModule,
            company_module_1.CompanyModule,
            colaborador_module_1.ColaboradorModule,
            exam_request_module_1.ExamRequestModule,
            medicos_module_1.MedicosModule,
            anamnese_module_1.AnamneseModule,
            upload_module_1.UploadModule,
            auth_module_1.AuthModule,
            portal_module_1.PortalModule,
            admin_module_1.AdminModule,
            mail_module_1.MailModule,
            jobs_module_1.JobsModule,
            calendar_module_1.CalendarModule,
            teleconsultation_module_1.TeleconsultationModule,
            financial_module_1.FinancialModule,
            support_module_1.SupportModule,
            clinic_profile_module_1.ClinicProfileModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService, { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map