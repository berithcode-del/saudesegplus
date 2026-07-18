"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AsoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const mail_service_1 = require("../mail/mail.service");
const financial_service_1 = require("../financial/financial.service");
const supabase_storage_service_1 = require("../upload/supabase-storage.service");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
let AsoService = AsoService_1 = class AsoService {
    prisma;
    mailService;
    financialService;
    storage;
    logger = new common_1.Logger(AsoService_1.name);
    constructor(prisma, mailService, financialService, storage) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.financialService = financialService;
        this.storage = storage;
    }
    async getPuppeteer() {
        const puppeteer = await import('puppeteer-core');
        return puppeteer.default;
    }
    async getChromium() {
        const chromium = await import('@sparticuz/chromium');
        return chromium.default;
    }
    shortId(value) {
        return value ? value.slice(0, 8) : null;
    }
    logAsoStep(context, step, details = {}) {
        this.logger.log(`[ASO_GENERATE] ${JSON.stringify({ step, ...context, ...details })}`);
    }
    logAsoError(context, step, error) {
        const normalized = error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { name: 'UnknownError', message: String(error), stack: undefined };
        this.logger.error(`[ASO_GENERATE] ${JSON.stringify({
            step,
            ...context,
            errorName: normalized.name,
            errorMessage: normalized.message,
        })}`, normalized.stack);
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    resolveTemplatePath() {
        const candidates = [
            path.resolve(process.cwd(), 'libs', 'pdf-template-aso.html'),
            path.resolve(process.cwd(), '..', '..', 'libs', 'pdf-template-aso.html'),
            path.resolve(__dirname, '..', '..', 'libs', 'pdf-template-aso.html'),
            path.resolve(__dirname, '..', '..', '..', 'libs', 'pdf-template-aso.html'),
            path.resolve(__dirname, '..', '..', '..', '..', '..', 'libs', 'pdf-template-aso.html'),
        ];
        const templatePath = candidates.find((candidate) => fs.existsSync(candidate));
        if (!templatePath) {
            this.logger.error(`Template do ASO nao encontrado. Caminhos testados: ${candidates.join(' | ')}`);
            throw new common_1.InternalServerErrorException('Template do ASO nao encontrado no servidor');
        }
        return templatePath;
    }
    formatExamPurpose(value) {
        const labels = {
            admissional: 'Admissional',
            periodico: 'Periódico',
            periódico: 'Periódico',
            demissional: 'Demissional',
            mudanca_funcao: 'Mudança de Função',
            'mudança de função': 'Mudança de Função',
            retorno_trabalho: 'Retorno ao Trabalho',
            'retorno ao trabalho': 'Retorno ao Trabalho',
        };
        return labels[value.toLocaleLowerCase('pt-BR')] ?? value;
    }
    formatBirthDate(birthDate) {
        if (!birthDate)
            return '';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 ||
            (monthDifference === 0 && today.getDate() < birthDate.getDate()))
            age--;
        return `${birthDate.toLocaleDateString('pt-BR')} (${age} anos)`;
    }
    async generatePdf(examRequestId, userId, decision, restrictionNotes) {
        const context = {
            requestId: this.shortId(examRequestId),
            userId: this.shortId(userId),
        };
        this.logAsoStep(context, 'start', {
            decision,
            hasRestrictionNotes: !!restrictionNotes,
            nodeEnv: process.env.NODE_ENV ?? null,
            hasChromePath: !!process.env.CHROME_PATH,
            cwd: process.cwd(),
        });
        try {
            const result = await this.generatePdfInternal(examRequestId, userId, decision, restrictionNotes, context);
            this.logAsoStep(context, 'complete', {
                asoDocumentId: this.shortId(result.asoDocumentId),
                hasPdfUrl: !!result.pdfUrl,
            });
            return result;
        }
        catch (error) {
            this.logAsoError(context, 'failed', error);
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.InternalServerErrorException('Falha ao gerar ASO');
        }
    }
    async generatePdfInternal(examRequestId, userId, decision, restrictionNotes, context) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
        this.logAsoStep(context, 'doctor_lookup_finished', {
            found: !!doctor,
            doctorId: this.shortId(doctor?.id),
            hasSignaturePin: !!doctor?.signaturePin,
        });
        if (!doctor)
            throw new common_1.NotFoundException('Perfil médico não encontrado');
        const request = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: {
                patient: true,
                clinic: true,
                invite: { include: { company: true } },
                results: { include: { type: true } },
            },
        });
        this.logAsoStep(context, 'request_lookup_finished', {
            found: !!request,
            status: request?.status ?? null,
            patientId: this.shortId(request?.patientId),
            clinicId: this.shortId(request?.clinicId),
            resultsCount: request?.results.length ?? 0,
            hasCompany: !!request?.invite?.company,
            hasClinic: !!request?.clinic,
            cboCode: request?.patient.functionCboCode ?? null,
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada');
        const asoDoc = await this.prisma.asoDocument.findFirst({
            where: {
                requestId: examRequestId,
                doctorId: doctor.id,
                signedAt: { not: null },
            },
            orderBy: { signedAt: 'desc' },
        });
        this.logAsoStep(context, 'signed_aso_lookup_finished', {
            found: !!asoDoc,
            asoDocumentId: this.shortId(asoDoc?.id),
            signedAt: asoDoc?.signedAt?.toISOString() ?? null,
        });
        if (!asoDoc) {
            throw new common_1.ForbiddenException('O documento precisa ser assinado antes da geração do PDF');
        }
        const occupationalRisk = request.patient.functionCboCode
            ? await this.prisma.occupationalRisk.findUnique({
                where: { cboCode: request.patient.functionCboCode },
            })
            : null;
        const todayPtBr = new Date().toLocaleDateString('pt-BR');
        const isApto = decision !== 'INAPTO';
        const company = request.invite?.company;
        const verificationBaseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
        const proceduresRowsHtml = request.results
            .map((result) => {
            const code = result.type.id.slice(0, 6).toUpperCase();
            const name = this.escapeHtml(result.type.name);
            const date = result.collectedAt.toLocaleDateString('pt-BR');
            return `<tr><td class="proc-code">${code}</td><td>${name}</td><td class="proc-date">${date}</td></tr>`;
        })
            .join('');
        const riskFactorsHtml = occupationalRisk
            ? `<li>${this.escapeHtml(`Grau de risco: ${occupationalRisk.riskGrade}`)}</li>`
            : '';
        const rawData = {
            asoNumero: asoDoc.id.slice(0, 8).toUpperCase(),
            patientName: request.patient.name,
            patientCpf: request.patient.cpf,
            patientNascimento: this.formatBirthDate(request.patient.birthDate),
            cargoFuncao: request.invite?.roleFunction ?? occupationalRisk?.functionName ?? '',
            cboCode: request.patient.functionCboCode ?? '',
            setorCargo: '',
            companyName: company?.razaoSocial ?? company?.nomeFantasia ?? company?.name ?? '',
            companyCnpj: company?.cnpj ?? '',
            companyEndereco: company?.address ?? '',
            clinicName: request.clinic?.name ?? '',
            clinicAddress: request.clinic?.address ?? '',
            clinicCnpj: request.clinic?.cnpj ?? '',
            clinicPhone: request.clinic?.phone ?? '',
            examPurpose: request.examPurpose,
            tipoExame: this.formatExamPurpose(request.examPurpose),
            examDate: todayPtBr,
            decision,
            restrictionNotes: restrictionNotes ?? '',
            doctorName: doctor.name,
            doctorCrm: `${doctor.crmNumber} ${doctor.crmState}`,
            signatureDate: asoDoc.signedAt?.toLocaleDateString('pt-BR') ?? todayPtBr,
            verificationCode: asoDoc.id.slice(0, 12).toUpperCase(),
            verificationUrl: `${verificationBaseUrl}/verificar/${asoDoc.id}`,
            requiresAltura: '',
            requiresConfinado: '',
            alturaAptoMark: '',
            alturaInaptoMark: '',
            confinadoAptoMark: '',
            confinadoInaptoMark: '',
            geralAptoMark: isApto ? '✕' : '',
            geralInaptoMark: isApto ? '' : '✕',
            riskFactorsHtml,
            proceduresRowsHtml,
        };
        const htmlKeys = new Set(['riskFactorsHtml', 'proceduresRowsHtml']);
        const data = Object.fromEntries(Object.entries(rawData).map(([key, value]) => [
            key,
            htmlKeys.has(key) ? value : this.escapeHtml(value),
        ]));
        const templatePath = this.resolveTemplatePath();
        this.logAsoStep(context, 'template_resolved', { templatePath });
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, varName, content) => data[varName] ? content : '');
        Object.entries(data).forEach(([key, value]) => {
            html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
        });
        const pdfDir = path.join(os.tmpdir(), 'saudesegplus', 'aso');
        if (!fs.existsSync(pdfDir))
            fs.mkdirSync(pdfDir, { recursive: true });
        const pdfPath = path.join(pdfDir, `aso-${asoDoc.id}.pdf`);
        this.logAsoStep(context, 'html_prepared', {
            htmlLength: html.length,
            pdfDir,
            pdfPath,
        });
        const chromium = await this.getChromium();
        const executablePath = process.env.CHROME_PATH || (await chromium.executablePath());
        this.logAsoStep(context, 'chromium_resolved', {
            executablePath,
            chromiumArgsCount: chromium.args.length,
        });
        const puppeteer = await this.getPuppeteer();
        this.logAsoStep(context, 'puppeteer_loaded');
        const browser = await puppeteer.launch({
            headless: true,
            executablePath,
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 60000,
        });
        this.logAsoStep(context, 'browser_launched');
        try {
            const page = await browser.newPage();
            this.logAsoStep(context, 'page_created');
            await page.setContent(html, { waitUntil: 'load' });
            this.logAsoStep(context, 'html_loaded_in_browser');
            await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
            this.logAsoStep(context, 'pdf_written', {
                exists: fs.existsSync(pdfPath),
                sizeBytes: fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : null,
            });
        }
        finally {
            await browser.close();
            this.logAsoStep(context, 'browser_closed');
        }
        this.logAsoStep(context, 'storage_upload_start');
        const { fileUrl } = await this.storage.uploadAsoPdf(pdfPath, asoDoc.id);
        this.logAsoStep(context, 'storage_uploaded', { hasFileUrl: !!fileUrl });
        try {
            fs.unlinkSync(pdfPath);
        }
        catch {
        }
        await this.prisma.asoDocument.update({
            where: { id: asoDoc.id },
            data: {
                pdfUrl: fileUrl,
                decision,
                restrictionNotes: restrictionNotes ?? '',
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });
        this.logAsoStep(context, 'aso_document_updated');
        await this.prisma.examRequest.update({
            where: { id: examRequestId },
            data: { status: 'CONCLUIDO' },
        });
        this.logAsoStep(context, 'request_completed');
        try {
            await this.financialService.generateExamTransactions(examRequestId);
            this.logger.log(`Transações financeiras geradas para ASO ${examRequestId}`);
        }
        catch (error) {
            this.logger.error(`Erro ao gerar transações financeiras para ASO ${examRequestId}`, error);
        }
        const patientUser = await this.prisma.userAccount.findUnique({
            where: { id: request.patient.userId },
        });
        if (patientUser?.email && !patientUser.email.endsWith('@walkin.temp')) {
            try {
                await this.mailService.sendAsoReady(patientUser.email, request.patient.name, fileUrl);
            }
            catch (error) {
                this.logger.error(`Falha ao enviar ASO para ${patientUser.email}`, error);
            }
        }
        this.logger.log(`ASO PDF gerado: ${pdfPath}`);
        return { pdfUrl: fileUrl, asoDocumentId: asoDoc.id };
    }
};
exports.AsoService = AsoService;
exports.AsoService = AsoService = AsoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        financial_service_1.FinancialService,
        supabase_storage_service_1.SupabaseStorageService])
], AsoService);
//# sourceMappingURL=aso.service.js.map