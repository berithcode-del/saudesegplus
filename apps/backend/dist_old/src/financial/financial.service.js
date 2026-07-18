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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma.service");
let FinancialService = class FinancialService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConfig() {
        let config = await this.prisma.financialConfig.findFirst();
        if (!config) {
            config = await this.prisma.financialConfig.create({
                data: {
                    defaultClinicFeePercent: 30,
                    defaultDoctorFeePercent: 40,
                    defaultPlatformFeePercent: 30,
                },
            });
        }
        return config;
    }
    async updateConfig(data) {
        const config = await this.getConfig();
        return this.prisma.financialConfig.update({
            where: { id: config.id },
            data,
        });
    }
    async listServicePrices() {
        return this.prisma.servicePrice.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async createServicePrice(data) {
        return this.prisma.servicePrice.create({ data });
    }
    async updateServicePrice(id, data) {
        return this.prisma.servicePrice.update({ where: { id }, data });
    }
    async deleteServicePrice(id) {
        return this.prisma.servicePrice.delete({ where: { id } });
    }
    async listExamItemPrices() {
        return this.prisma.examItemPrice.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }
    async createExamItemPrice(data) {
        this.validatePriceItem(data);
        return this.prisma.examItemPrice.create({ data });
    }
    async updateExamItemPrice(id, data) {
        this.validatePriceItem(data);
        return this.prisma.examItemPrice.update({ where: { id }, data });
    }
    async quote(data) {
        const cboCode = data.cboCode?.trim();
        const risk = cboCode
            ? await this.prisma.occupationalRisk.findUnique({ where: { cboCode } })
            : null;
        const codes = [
            'ASO',
            ...(risk?.requiredExams ?? []),
            ...(data.specialClearances ?? []),
        ];
        const uniqueCodes = [
            ...new Set(codes.map((code) => code.trim()).filter(Boolean)),
        ];
        const prices = await this.prisma.examItemPrice.findMany({
            where: { code: { in: uniqueCodes }, isActive: true },
        });
        const priceByCode = new Map(prices.map((price) => [price.code, price]));
        const missing = uniqueCodes.filter((code) => !priceByCode.has(code));
        if (missing.length) {
            throw new common_1.BadRequestException(`Preco nao configurado para: ${missing.join(', ')}.`);
        }
        const items = uniqueCodes.map((code) => {
            const price = priceByCode.get(code);
            return {
                code: price.code,
                name: price.name,
                category: price.category,
                amount: price.amount,
                clinicFeePercent: price.clinicFeePercent,
                doctorFeePercent: price.doctorFeePercent,
                platformFeePercent: price.platformFeePercent,
            };
        });
        return {
            cboCode,
            examPurpose: data.examPurpose,
            items,
            total: this.money(items.reduce((sum, item) => sum + item.amount, 0)),
        };
    }
    async createPayment(data) {
        if (data.flow === client_1.PaymentFlow.COMPANY_INVITE && !data.companyId) {
            throw new common_1.BadRequestException('companyId e obrigatorio para convite empresarial.');
        }
        if (data.flow === client_1.PaymentFlow.CLINIC_WALK_IN && !data.clinicId) {
            throw new common_1.BadRequestException('clinicId e obrigatorio para atendimento presencial.');
        }
        if (data.externalId) {
            const existing = await this.prisma.payment.findUnique({
                where: { externalId: data.externalId },
            });
            if (existing)
                return existing;
        }
        let clinicId = data.clinicId;
        if (data.flow === client_1.PaymentFlow.COMPANY_INVITE) {
            const company = await this.prisma.company.findUnique({
                where: { id: data.companyId },
                select: { clinicId: true },
            });
            if (!company)
                throw new common_1.NotFoundException('Empresa nao encontrada.');
            clinicId = company.clinicId ?? undefined;
        }
        const quote = await this.quote(data);
        return this.prisma.payment.create({
            data: {
                flow: data.flow,
                amount: quote.total,
                method: data.method,
                companyId: data.companyId,
                clinicId,
                externalId: data.externalId,
                quoteSnapshot: JSON.stringify(quote),
                checkoutPayload: data.checkoutPayload
                    ? JSON.stringify(data.checkoutPayload)
                    : null,
            },
        });
    }
    async assertPaymentAccess(paymentId, user) {
        if (user.role === 'ADMIN')
            return;
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            select: { companyId: true, clinicId: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Pagamento nao encontrado.');
        if (user.role === 'COMPANY_ADMIN' && payment.companyId === user.profileId)
            return;
        const clinicId = await this.resolveClinicId(user.role, user.profileId);
        if (clinicId && payment.clinicId === clinicId)
            return;
        throw new common_1.ForbiddenException('Acesso restrito a este pagamento.');
    }
    async confirmPayment(id, method) {
        return this.prisma.$transaction(async (tx) => {
            const now = new Date();
            const transition = await tx.payment.updateMany({
                where: { id, status: client_1.PaymentStatus.PENDENTE },
                data: {
                    status: client_1.PaymentStatus.PAGO,
                    confirmedAt: now,
                    ...(method ? { method } : {}),
                },
            });
            const payment = await tx.payment.findUnique({ where: { id } });
            if (!payment)
                throw new common_1.NotFoundException('Pagamento nao encontrado.');
            if (transition.count === 0) {
                if (payment.status === client_1.PaymentStatus.PAGO)
                    return payment;
                throw new common_1.ConflictException('Este pagamento nao pode mais ser confirmado.');
            }
            const quote = this.parseQuote(payment.quoteSnapshot);
            await tx.financialTransaction.create({
                data: {
                    type: 'RECEITA',
                    category: 'EXAME_ASO',
                    description: `Pagamento de pacote ocupacional - ${payment.flow}`,
                    amount: payment.amount,
                    method: method ?? payment.method,
                    companyId: payment.companyId,
                    clinicId: payment.clinicId,
                    paymentId: payment.id,
                    status: 'PAGO',
                    paidAt: now,
                },
            });
            const clinicAmount = this.money(quote.items.reduce((sum, item) => sum + (item.amount * item.clinicFeePercent) / 100, 0));
            if (payment.clinicId && clinicAmount > 0) {
                await tx.financialTransaction.create({
                    data: {
                        type: 'REPASSE',
                        category: 'TAXA_CLINICA',
                        description: 'Repasse de coleta do pacote ocupacional',
                        amount: clinicAmount,
                        clinicId: payment.clinicId,
                        paymentId: payment.id,
                    },
                });
            }
            return payment;
        });
    }
    validatePriceItem(data) {
        if (data.amount !== undefined && data.amount < 0) {
            throw new common_1.BadRequestException('O valor do item nao pode ser negativo.');
        }
        const fees = [
            data.clinicFeePercent,
            data.doctorFeePercent,
            data.platformFeePercent,
        ].filter((value) => value !== undefined);
        if (fees.some((fee) => fee < 0 || fee > 100)) {
            throw new common_1.BadRequestException('Percentuais devem estar entre 0 e 100.');
        }
    }
    parseQuote(value) {
        try {
            const quote = JSON.parse(value);
            if (!Array.isArray(quote.items) || typeof quote.total !== 'number') {
                throw new Error('invalid quote');
            }
            return quote;
        }
        catch {
            throw new common_1.BadRequestException('A cotacao registrada para este pagamento e invalida.');
        }
    }
    money(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
    async listTransactions(filters) {
        const where = {};
        if (filters.type)
            where.type = filters.type;
        if (filters.category)
            where.category = filters.category;
        if (filters.status)
            where.status = filters.status;
        if (filters.clinicId)
            where.clinicId = filters.clinicId;
        if (filters.doctorId)
            where.doctorId = filters.doctorId;
        if (filters.companyId)
            where.companyId = filters.companyId;
        if (filters.month !== undefined && filters.year !== undefined) {
            const start = new Date(filters.year, filters.month, 1);
            const end = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
            where.transactionDate = { gte: start, lte: end };
        }
        return this.prisma.financialTransaction.findMany({
            where,
            include: {
                clinic: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
                company: {
                    select: { id: true, razaoSocial: true, nomeFantasia: true },
                },
                examRequest: { select: { id: true, examPurpose: true } },
                servicePrice: { select: { id: true, name: true } },
            },
            orderBy: { transactionDate: 'desc' },
        });
    }
    async resolveClinicId(role, profileId) {
        if (!profileId)
            return null;
        if (role === 'CLINIC')
            return profileId;
        if (role !== 'OPERATOR')
            return null;
        const operator = await this.prisma.operator.findUnique({
            where: { id: profileId },
            select: { clinicId: true },
        });
        return operator?.clinicId ?? null;
    }
    async createTransaction(data) {
        return this.prisma.financialTransaction.create({ data });
    }
    async markAsPaid(id) {
        return this.prisma.financialTransaction.update({
            where: { id },
            data: { status: 'PAGO', paidAt: new Date() },
        });
    }
    async getSummary(month, year) {
        const where = {};
        if (month !== undefined && year !== undefined) {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0, 23, 59, 59);
            where.transactionDate = { gte: start, lte: end };
        }
        const transactions = await this.prisma.financialTransaction.findMany({
            where,
        });
        const receita = transactions
            .filter((t) => t.type === 'RECEITA')
            .reduce((sum, t) => sum + t.amount, 0);
        const despesas = transactions
            .filter((t) => t.type === 'DESPESA')
            .reduce((sum, t) => sum + t.amount, 0);
        const repasseClinica = transactions
            .filter((t) => t.type === 'REPASSE' && t.category === 'TAXA_CLINICA')
            .reduce((sum, t) => sum + t.amount, 0);
        const repasseMedico = transactions
            .filter((t) => t.type === 'REPASSE' && t.category === 'HONORARIO_MEDICO')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalRepasses = repasseClinica + repasseMedico;
        const lucroLiquido = receita - despesas - totalRepasses;
        const pendentesClinica = transactions
            .filter((t) => t.category === 'TAXA_CLINICA' && t.status === 'PENDENTE')
            .reduce((sum, t) => sum + t.amount, 0);
        const pendentesMedico = transactions
            .filter((t) => t.category === 'HONORARIO_MEDICO' && t.status === 'PENDENTE')
            .reduce((sum, t) => sum + t.amount, 0);
        return {
            receita,
            despesas,
            repasseClinica,
            repasseMedico,
            totalRepasses,
            lucroLiquido,
            pendentesClinica,
            pendentesMedico,
            totalTransactions: transactions.length,
        };
    }
    async generateExamTransactions(examRequestId) {
        const examRequest = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: {
                clinic: true,
                payment: true,
                invite: { include: { company: true } },
                asoDocuments: { include: { doctor: true }, take: 1 },
            },
        });
        if (!examRequest)
            throw new common_1.NotFoundException('ExamRequest não encontrado');
        let servicePrice = await this.prisma.servicePrice.findFirst({
            where: { isActive: true },
        });
        if (!servicePrice) {
            const config = await this.getConfig();
            servicePrice = await this.prisma.servicePrice.create({
                data: {
                    name: 'Exame Ocupacional Padrão',
                    basePrice: 250.0,
                    clinicFeePercent: config.defaultClinicFeePercent,
                    doctorFeePercent: config.defaultDoctorFeePercent,
                    platformFeePercent: config.defaultPlatformFeePercent,
                },
            });
        }
        const basePrice = servicePrice.basePrice;
        const clinicAmount = (basePrice * servicePrice.clinicFeePercent) / 100;
        const doctorAmount = (basePrice * servicePrice.doctorFeePercent) / 100;
        const doctor = examRequest.asoDocuments[0]?.doctor;
        const company = examRequest.invite?.company;
        if (examRequest.payment?.status === client_1.PaymentStatus.PAGO) {
            const quote = this.parseQuote(examRequest.payment.quoteSnapshot);
            const doctorAmount = this.money(quote.items.reduce((sum, item) => sum + (item.amount * item.doctorFeePercent) / 100, 0));
            if (!doctor?.id || doctorAmount <= 0) {
                return { success: true, doctorAmount: 0 };
            }
            const existingPayout = await this.prisma.financialTransaction.findFirst({
                where: {
                    examRequestId,
                    doctorId: doctor.id,
                    category: 'HONORARIO_MEDICO',
                },
            });
            if (existingPayout)
                return { success: true, doctorAmount, existing: true };
            await this.createTransaction({
                type: 'REPASSE',
                category: 'HONORARIO_MEDICO',
                description: `Honorario medico - Exame ${examRequest.examPurpose}`,
                amount: doctorAmount,
                doctorId: doctor.id,
                examRequestId,
            });
            return { success: true, doctorAmount };
        }
        await this.createTransaction({
            type: 'RECEITA',
            category: 'EXAME_ASO',
            description: `Exame ${examRequest.examPurpose} — ${examRequest.invite?.company?.razaoSocial ?? 'Walk-in'}`,
            amount: basePrice,
            companyId: company?.id,
            clinicId: examRequest.clinicId ?? undefined,
            examRequestId,
            servicePriceId: servicePrice.id,
        });
        if (examRequest.clinicId && clinicAmount > 0) {
            await this.createTransaction({
                type: 'REPASSE',
                category: 'TAXA_CLINICA',
                description: `Repasse clínica — Exame ${examRequest.examPurpose}`,
                amount: clinicAmount,
                clinicId: examRequest.clinicId,
                examRequestId,
                servicePriceId: servicePrice.id,
            });
        }
        if (doctor?.id && doctorAmount > 0) {
            await this.createTransaction({
                type: 'REPASSE',
                category: 'HONORARIO_MEDICO',
                description: `Honorário médico — Exame ${examRequest.examPurpose}`,
                amount: doctorAmount,
                doctorId: doctor.id,
                examRequestId,
                servicePriceId: servicePrice.id,
            });
        }
        return { success: true, basePrice, clinicAmount, doctorAmount };
    }
};
exports.FinancialService = FinancialService;
exports.FinancialService = FinancialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialService);
//# sourceMappingURL=financial.service.js.map