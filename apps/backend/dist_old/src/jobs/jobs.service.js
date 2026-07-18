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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("../company/company.gateway");
const mail_service_1 = require("../mail/mail.service");
let JobsService = JobsService_1 = class JobsService {
    prisma;
    companyGateway;
    mailService;
    logger = new common_1.Logger(JobsService_1.name);
    constructor(prisma, companyGateway, mailService) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
        this.mailService = mailService;
    }
    async expirarConvitesVencidos() {
        const result = await this.prisma.examInvite.updateMany({
            where: {
                status: { in: ['ENVIADO', 'ABERTO'] },
                expiresAt: { lt: new Date() },
            },
            data: { status: 'EXPIRADO' },
        });
        this.logger.log(`Convites expirados: ${result.count}`);
    }
    async verificarDocumentosVencidos() {
        const now = new Date();
        const empresas = await this.prisma.company.findMany({
            where: {
                status: 'LIBERADA',
                OR: [
                    { pcmsoValidUntil: { lt: now } },
                    { ppraValidUntil: { lt: now } },
                ],
            },
        });
        for (const empresa of empresas) {
            await this.prisma.company.update({
                where: { id: empresa.id },
                data: { status: 'DOCUMENTACAO_VENCIDA' },
            });
        }
        this.logger.log(`Empresas com documentação vencida: ${empresas.length}`);
    }
    async avisarAsosProximosDoVencimento() {
        const alertWindows = [30, 15, 7];
        const now = new Date();
        let totalAlerts = 0;
        for (const windowDays of alertWindows) {
            const start = new Date(now);
            start.setDate(start.getDate() + windowDays);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            const asos = await this.prisma.asoDocument.findMany({
                where: {
                    decision: { equals: 'APTO', mode: 'insensitive' },
                    validUntil: { gte: start, lte: end },
                },
                include: {
                    request: {
                        include: {
                            patient: {
                                include: {
                                    companies: {
                                        where: { OR: [{ endDate: null }, { endDate: { gte: now } }] },
                                        include: { company: true },
                                    },
                                },
                            },
                            invite: true,
                        },
                    },
                },
            });
            const byCompany = new Map();
            for (const aso of asos) {
                for (const relation of aso.request.patient.companies) {
                    const current = byCompany.get(relation.companyId) ?? { company: relation.company, items: [] };
                    current.items.push(aso);
                    byCompany.set(relation.companyId, current);
                }
            }
            for (const [companyId, group] of byCompany) {
                const payloadItems = group.items.map((aso) => ({
                    asoId: aso.id,
                    patientName: aso.request.patient.name,
                    examType: aso.request.invite?.examType ?? aso.request.examPurpose,
                    validUntil: aso.validUntil.toISOString(),
                    daysUntilExpiration: windowDays,
                }));
                this.companyGateway.emitAsoExpirationAlert(companyId, {
                    windowDays,
                    total: payloadItems.length,
                    asos: payloadItems,
                });
                if (group.company.contactEmail) {
                    try {
                        await this.mailService.sendAsoExpirationAlert(group.company.contactEmail, group.company.nomeFantasia ?? group.company.razaoSocial ?? group.company.name ?? 'Empresa', group.items.map((aso) => ({
                            patientName: aso.request.patient.name,
                            examType: aso.request.invite?.examType ?? aso.request.examPurpose,
                            validUntil: aso.validUntil,
                            daysUntilExpiration: windowDays,
                        })));
                    }
                    catch (err) {
                        this.logger.error(`Falha ao enviar aviso de ASO para ${group.company.contactEmail}`, err);
                    }
                }
                totalAlerts += payloadItems.length;
            }
        }
        this.logger.log(`Avisos de ASO proximo do vencimento: ${totalAlerts}`);
    }
};
exports.JobsService = JobsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "expirarConvitesVencidos", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "verificarDocumentosVencidos", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "avisarAsosProximosDoVencimento", null);
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway,
        mail_service_1.MailService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map