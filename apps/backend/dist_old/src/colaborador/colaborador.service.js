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
exports.ColaboradorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("../company/company.gateway");
let ColaboradorService = class ColaboradorService {
    prisma;
    companyGateway;
    constructor(prisma, companyGateway) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
    }
    async validateInviteAndRegister(args) {
        const { token, name, password } = args;
        const invite = await this.prisma.examInvite.findUnique({
            where: { token },
            include: { company: true },
        });
        if (!invite) {
            throw new common_1.NotFoundException('Convite não encontrado');
        }
        if (invite.status !== client_1.InviteStatus.ENVIADO &&
            invite.status !== client_1.InviteStatus.ABERTO) {
            throw new common_1.BadRequestException('Convite já utilizado ou expirado');
        }
        if (invite.expiresAt < new Date()) {
            await this.prisma.examInvite.update({
                where: { id: invite.id },
                data: { status: client_1.InviteStatus.EXPIRADO },
            });
            throw new common_1.BadRequestException('Convite expirado');
        }
        if (!invite.expectedEmail) {
            throw new common_1.BadRequestException('E-mail do convite não fornecido');
        }
        if (!invite.expectedCpf) {
            throw new common_1.BadRequestException('CPF do convite não fornecido');
        }
        const existingUser = await this.prisma.userAccount.findUnique({
            where: { email: invite.expectedEmail },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Já existe um cadastro com este e-mail');
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.prisma.userAccount.create({
            data: {
                email: invite.expectedEmail,
                passwordHash,
                role: client_1.Role.PATIENT,
            },
        });
        const patient = await this.prisma.patient.create({
            data: {
                userId: user.id,
                cpf: invite.expectedCpf.replace(/\D/g, ''),
                name,
                birthDate: invite.expectedBirthDate ?? undefined,
                phone: '',
                functionCboCode: invite.roleFunctionCboCode || invite.roleFunction || '0000-00',
            },
        });
        await this.prisma.companyPatientRelation.create({
            data: {
                companyId: invite.companyId,
                patientId: patient.id,
            },
        });
        const examRequest = await this.prisma.examRequest.create({
            data: {
                patientId: patient.id,
                clinicId: invite.company.clinicId ?? undefined,
                inviteId: invite.id,
                source: 'convite_empresa',
                examPurpose: invite.examType,
                status: 'AGUARDANDO_COLETA',
                paymentId: invite.paymentId ?? undefined,
            },
        });
        await this.prisma.examInvite.update({
            where: { id: invite.id },
            data: {
                status: client_1.InviteStatus.CONCLUIDO,
                openedAt: invite.openedAt ?? new Date(),
            },
        });
        const timelineEvent = await this.prisma.examTimelineEvent.create({
            data: {
                inviteId: invite.id,
                examRequestId: examRequest.id,
                eventType: 'CADASTRO_CONCLUIDO',
            },
        });
        this.companyGateway.emitTimelineUpdate(invite.companyId, {
            inviteId: invite.id,
            eventType: 'CADASTRO_CONCLUIDO',
            occurredAt: timelineEvent.occurredAt.toISOString(),
        });
        this.companyGateway.emitInviteStatusChange(invite.companyId, {
            inviteId: invite.id,
            status: client_1.InviteStatus.CONCLUIDO,
            examStatus: examRequest.status,
        });
        return {
            userId: user.id,
            email: user.email,
            name: patient.name,
            patientId: patient.id,
            companyId: invite.companyId,
            examRequestId: examRequest.id,
            examRequestStatus: examRequest.status,
        };
    }
    async listSolicitacoes(patientId) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Colaborador não encontrado');
        }
        return this.prisma.examRequest.findMany({
            where: { patientId },
            include: {
                clinic: true,
                results: { include: { type: true } },
                asoDocuments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ColaboradorService = ColaboradorService;
exports.ColaboradorService = ColaboradorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway])
], ColaboradorService);
//# sourceMappingURL=colaborador.service.js.map