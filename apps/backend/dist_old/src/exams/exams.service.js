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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("../company/company.gateway");
const queue_service_1 = require("../queue/queue.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
let ExamsService = class ExamsService {
    prisma;
    companyGateway;
    queueService;
    constructor(prisma, companyGateway, queueService) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
        this.queueService = queueService;
    }
    async createExam(examRequestId, examType, valueJson, attachmentUrl, actor, selectedOperatorId) {
        const request = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: { patient: true },
        });
        if (!request) {
            throw new common_1.NotFoundException('ExamRequest não encontrado');
        }
        if (!examType) {
            throw new common_1.BadRequestException('Tipo de exame nao informado');
        }
        const operator = await this.resolveOperatorForCollection(request.clinicId, actor, selectedOperatorId);
        if (!operator) {
            throw new common_1.BadRequestException('Nenhum operador cadastrado para a clínica informada. Cadastre um operador antes de registrar exames.');
        }
        if (examType === 'outros' && !String(valueJson?.nome_exame ?? '').trim()) {
            throw new common_1.BadRequestException('Nome do exame adicional nao informado');
        }
        const cboCode = request.patient.functionCboCode;
        if (cboCode) {
            const risk = await this.prisma.occupationalRisk.findUnique({
                where: { cboCode },
            });
            const requiredExams = risk?.requiredExams ?? [];
            if (requiredExams.length > 0 &&
                examType !== 'outros' &&
                !requiredExams.includes(examType)) {
                throw new common_1.BadRequestException(`Exame "${examType}" nao e obrigatorio para o CBO ${cboCode}. Se for adicional, registre como "outros".`);
            }
        }
        const requiredFields = {
            pa: ['pressao_sistolica', 'pressao_diastolica'],
            audiometria: ['via_aerea_od', 'via_aerea_oe'],
            acuidade_visual: ['od', 'oe'],
        }[examType];
        if (requiredFields && !attachmentUrl) {
            const missingFields = requiredFields.filter((field) => !valueJson[field]);
            if (missingFields.length > 0) {
                throw new common_1.BadRequestException(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
            }
        }
        let examTypeRecord = await this.prisma.examType.findFirst({
            where: { name: examType },
        });
        if (!examTypeRecord) {
            examTypeRecord = await this.prisma.examType.create({
                data: {
                    name: examType,
                    category: 'outros',
                    requiresEquipment: false,
                    canBeRemoteReview: true,
                    validityDays: 365,
                },
            });
        }
        let result;
        try {
            result = await this.prisma.examResult.create({
                data: {
                    requestId: examRequestId,
                    typeId: examTypeRecord.id,
                    valueJson: JSON.stringify(valueJson),
                    attachmentUrl: attachmentUrl || null,
                    collectedById: operator.id,
                    source: 'manual',
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Este exame ja foi registrado para a solicitacao.');
            }
            throw error;
        }
        await this.prisma.examRequest.update({
            where: { id: examRequestId },
            data: { status: 'EM_COLETA' },
        });
        return result;
    }
    async sendToMedicalQueue(examRequestId) {
        const request = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: { invite: { include: { company: true } }, clinic: true },
        });
        if (!request) {
            throw new common_1.NotFoundException('ExamRequest não encontrado');
        }
        await this.prisma.examRequest.update({
            where: { id: examRequestId },
            data: { status: 'NA_FILA_MEDICA' },
        });
        await this.queueService.enqueue(examRequestId);
        return { success: true };
    }
    async findTypes() {
        return this.prisma.examType.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                category: true,
                requiresEquipment: true,
                canBeRemoteReview: true,
            },
        });
    }
    async findRequiredByCbo(cboCode) {
        const risk = await this.prisma.occupationalRisk.findUnique({
            where: { cboCode },
        });
        if (!risk)
            return {
                requiredExams: [],
                riskGrade: 'desconhecido',
                requiresInPerson: false,
            };
        return {
            requiredExams: risk.requiredExams,
            riskGrade: risk.riskGrade,
            requiresInPerson: risk.requiresInPerson,
        };
    }
    async searchByFunctionName(query) {
        const trimmedQuery = query?.trim();
        if (!trimmedQuery || trimmedQuery.length < 2)
            return [];
        const normalizedCodeQuery = trimmedQuery.replace(/\D/g, '');
        return this.prisma.occupationalRisk.findMany({
            where: {
                OR: [
                    { functionName: { contains: trimmedQuery, mode: 'insensitive' } },
                    { cboCode: { contains: trimmedQuery } },
                    ...(normalizedCodeQuery.length >= 4
                        ? [
                            {
                                cboCode: {
                                    contains: `${normalizedCodeQuery.slice(0, 4)}-${normalizedCodeQuery.slice(4)}`,
                                },
                            },
                        ]
                        : []),
                ],
            },
            select: { cboCode: true, functionName: true },
            take: 15,
            orderBy: { functionName: 'asc' },
        });
    }
    async resolveOperatorForCollection(clinicId, actor, selectedOperatorId) {
        if (!clinicId)
            throw new common_1.BadRequestException('Clinica da solicitacao nao informada.');
        const operatorId = actor?.role === 'OPERATOR' ? actor.profileId : selectedOperatorId;
        if (!operatorId)
            throw new common_1.BadRequestException('Informe o operador responsavel pela coleta.');
        const operator = await this.prisma.operator.findUnique({ where: { id: operatorId } });
        if (!operator || operator.clinicId !== clinicId) {
            throw new common_1.BadRequestException('Operador nao pertence a clinica desta solicitacao.');
        }
        return operator;
    }
    async createPatient(data) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: data.paymentId },
            select: {
                id: true,
                flow: true,
                status: true,
                clinicId: true,
                examRequest: { select: { id: true } },
            },
        });
        if (!payment ||
            payment.flow !== client_2.PaymentFlow.CLINIC_WALK_IN ||
            payment.status !== client_2.PaymentStatus.PAGO) {
            throw new common_1.BadRequestException('O atendimento exige um pagamento presencial confirmado.');
        }
        if (payment.clinicId &&
            data.clinicId &&
            payment.clinicId !== data.clinicId) {
            throw new common_1.BadRequestException('O pagamento pertence a outra clinica.');
        }
        if (payment.examRequest) {
            throw new common_1.BadRequestException('Este pagamento ja foi usado em outro atendimento.');
        }
        const existingPatient = await this.prisma.patient.findUnique({
            where: { cpf: data.cpf },
        });
        if (existingPatient) {
            const existingRequest = await this.prisma.examRequest.findFirst({
                where: { patientId: existingPatient.id, status: { not: 'CONCLUIDO' } },
            });
            if (existingRequest) {
                return {
                    patient: existingPatient,
                    examRequest: existingRequest,
                    existing: true,
                };
            }
            const examRequest = await this.prisma.examRequest.create({
                data: {
                    patientId: existingPatient.id,
                    clinicId: data.clinicId,
                    source: data.inviteId ? 'convite' : 'direto',
                    examPurpose: data.examPurpose,
                    status: 'AGUARDANDO_COLETA',
                    inviteId: data.inviteId,
                    paymentId: payment.id,
                },
            });
            return { patient: existingPatient, examRequest };
        }
        const user = await this.prisma.userAccount.create({
            data: {
                email: `${data.cpf}@walkin.temp`,
                passwordHash: await bcrypt.hash((0, crypto_1.randomUUID)(), 12),
                role: 'PATIENT',
            },
        });
        const patient = await this.prisma.patient.create({
            data: {
                userId: user.id,
                cpf: data.cpf,
                name: data.name,
                phone: data.phone ?? '',
                functionCboCode: data.functionCboCode ?? '0000-00',
            },
        });
        const examRequest = await this.prisma.examRequest.create({
            data: {
                patientId: patient.id,
                clinicId: data.clinicId,
                source: data.inviteId ? 'convite' : 'direto',
                examPurpose: data.examPurpose,
                status: 'AGUARDANDO_COLETA',
                inviteId: data.inviteId,
                paymentId: payment.id,
            },
        });
        return { patient, examRequest };
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway,
        queue_service_1.QueueService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map