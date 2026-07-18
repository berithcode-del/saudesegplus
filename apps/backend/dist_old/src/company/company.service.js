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
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("./company.gateway");
const mail_service_1 = require("../mail/mail.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const supabase_storage_service_1 = require("../upload/supabase-storage.service");
const path_1 = require("path");
let CompanyService = class CompanyService {
    prisma;
    companyGateway;
    mailService;
    storage;
    constructor(prisma, companyGateway, mailService, storage) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
        this.mailService = mailService;
        this.storage = storage;
    }
    async createCompany(dto) {
        const email = dto.contactEmail.trim().toLowerCase();
        const passwordHash = await bcrypt.hash(dto.password ?? (0, crypto_1.randomUUID)(), 12);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const existingCompany = await tx.company.findUnique({
                    where: { cnpj: dto.cnpj },
                    include: { admins: true },
                });
                const existingUser = await tx.userAccount.findUnique({
                    where: { email },
                    include: { companyAdminProfile: true },
                });
                if (existingCompany?.admins.length) {
                    throw new common_1.ConflictException('CNPJ ja cadastrado');
                }
                if (existingUser?.companyAdminProfile) {
                    throw new common_1.ConflictException('E-mail ja cadastrado');
                }
                if (existingUser && existingUser.role !== 'COMPANY_ADMIN') {
                    throw new common_1.ConflictException('E-mail ja cadastrado em outro perfil');
                }
                const company = existingCompany
                    ? await tx.company.update({
                        where: { id: existingCompany.id },
                        data: {
                            razaoSocial: dto.razaoSocial,
                            nomeFantasia: dto.nomeFantasia,
                            contactEmail: email,
                            address: dto.address,
                            cep: dto.cep,
                            city: dto.city,
                            state: dto.state,
                            lat: dto.lat,
                            lng: dto.lng,
                        },
                    })
                    : await tx.company.create({
                        data: {
                            cnpj: dto.cnpj,
                            razaoSocial: dto.razaoSocial,
                            nomeFantasia: dto.nomeFantasia,
                            contactEmail: email,
                            address: dto.address,
                            cep: dto.cep,
                            city: dto.city,
                            state: dto.state,
                            lat: dto.lat,
                            lng: dto.lng,
                            status: 'CADASTRO_INCOMPLETO',
                        },
                    });
                const user = existingUser
                    ? await tx.userAccount.update({
                        where: { id: existingUser.id },
                        data: { passwordHash, role: 'COMPANY_ADMIN' },
                    })
                    : await tx.userAccount.create({
                        data: {
                            email,
                            passwordHash,
                            role: 'COMPANY_ADMIN',
                        },
                    });
                await tx.companyAdmin.create({
                    data: {
                        userId: user.id,
                        companyId: company.id,
                    },
                });
                const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
                return { company, user: userWithoutPassword };
            });
        }
        catch (error) {
            if (error instanceof common_1.ConflictException)
                throw error;
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('CNPJ ou e-mail ja cadastrado');
            }
            throw error;
        }
    }
    async getCompany(companyId) {
        return this.prisma.company.findUnique({
            where: { id: companyId },
            include: { admins: true, clinic: true },
        });
    }
    async listCompanies() {
        return this.prisma.company.findMany({
            include: { clinic: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateCompany(companyId, dto) {
        const data = {};
        if (dto.nomeFantasia !== undefined)
            data.nomeFantasia = dto.nomeFantasia;
        if (dto.address !== undefined)
            data.address = dto.address;
        if (dto.cep !== undefined)
            data.cep = dto.cep;
        if (dto.city !== undefined)
            data.city = dto.city;
        if (dto.state !== undefined)
            data.state = dto.state;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.contactEmail !== undefined)
            data.contactEmail = dto.contactEmail;
        const locationChanged = dto.cep !== undefined || dto.city !== undefined || dto.state !== undefined;
        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data,
        });
        if (locationChanged || !updated.clinicId) {
            const clinic = await this.findBestClinicForCompany(companyId, locationChanged);
            if (clinic?.id !== updated.clinicId) {
                return this.prisma.company.update({
                    where: { id: companyId },
                    data: { clinicId: clinic?.id ?? null },
                });
            }
        }
        return updated;
    }
    async updateCompanyStatus(companyId, status) {
        return this.prisma.company.update({
            where: { id: companyId },
            data: { status: status },
        });
    }
    async createInvite(companyId, dto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                status: true,
                pcmsoValidUntil: true,
                ppraValidUntil: true,
                razaoSocial: true,
            },
        });
        if (!company) {
            throw new Error('Empresa não encontrada');
        }
        const now = new Date();
        const pcmsoValid = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
        const ppraValid = company.ppraValidUntil && company.ppraValidUntil > now;
        if (company.status !== 'LIBERADA') {
            throw new Error(`Empresa com status '${company.status}'. É necessário ter documentação PCMSO e PPRA válidas para criar convites.`);
        }
        if (!pcmsoValid || !ppraValid) {
            throw new Error('Documentação PCMSO ou PPRA vencida. Por favor, renove os documentos antes de criar novos convites.');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { id: dto.paymentId },
            select: {
                id: true,
                companyId: true,
                flow: true,
                status: true,
                quoteSnapshot: true,
                invite: { select: { id: true } },
            },
        });
        if (!payment ||
            payment.companyId !== companyId ||
            payment.flow !== client_1.PaymentFlow.COMPANY_INVITE ||
            payment.status !== client_1.PaymentStatus.PAGO) {
            throw new common_1.ConflictException('O convite exige um pagamento empresarial confirmado.');
        }
        if (payment.invite) {
            throw new common_1.ConflictException('Este pagamento ja foi usado para gerar um convite.');
        }
        try {
            const quote = JSON.parse(payment.quoteSnapshot);
            if (quote.cboCode !== dto.roleFunctionCboCode ||
                quote.examPurpose !== dto.examType) {
                throw new common_1.ConflictException('O pagamento foi cotado para outro CBO ou tipo de exame.');
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException)
                throw error;
            throw new common_1.ConflictException('A cotacao vinculada ao pagamento e invalida.');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays ?? 7));
        let clinicId = dto.clinicId;
        if (!clinicId) {
            const bestClinic = await this.findBestClinicForCompany(companyId);
            if (bestClinic)
                clinicId = bestClinic.id;
        }
        const invite = await this.prisma.examInvite.create({
            data: {
                companyId,
                clinicId,
                collaboratorName: dto.collaboratorName,
                expectedCpf: dto.expectedCpf?.replace(/\D/g, '') ?? null,
                expectedEmail: dto.expectedEmail,
                expectedBirthDate: dto.expectedBirthDate
                    ? new Date(dto.expectedBirthDate)
                    : null,
                roleFunction: dto.roleFunction,
                roleFunctionCboCode: dto.roleFunctionCboCode,
                examType: dto.examType,
                paymentId: payment.id,
                expiresAt,
                status: 'ENVIADO',
            },
            include: { company: true },
        });
        await this.prisma.examTimelineEvent.create({
            data: {
                inviteId: invite.id,
                eventType: 'LINK_ENVIADO',
            },
        });
        this.companyGateway.emitTimelineUpdate(companyId, {
            inviteId: invite.id,
            eventType: 'LINK_ENVIADO',
            occurredAt: invite.sentAt.toISOString(),
        });
        if (dto.expectedEmail) {
            const link = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/p/${invite.token}`;
            void this.mailService
                .sendInviteLink(dto.expectedEmail, invite.company.razaoSocial ?? '', link, invite.expiresAt)
                .catch((err) => console.error(`[Mail] Falha ao enviar e-mail para ${dto.expectedEmail}:`, err));
        }
        return invite;
    }
    async listInvites(companyId) {
        return this.prisma.examInvite.findMany({
            where: { companyId },
            include: {
                timelineEvents: { orderBy: { occurredAt: 'asc' } },
                examRequest: { include: { results: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listActiveAsos(companyId) {
        const now = new Date();
        const asos = await this.prisma.asoDocument.findMany({
            where: {
                validUntil: { gte: now },
                request: {
                    patient: {
                        companies: {
                            some: {
                                companyId,
                                OR: [{ endDate: null }, { endDate: { gte: now } }],
                            },
                        },
                    },
                },
            },
            include: {
                request: {
                    include: {
                        patient: true,
                        invite: true,
                    },
                },
                doctor: true,
            },
            orderBy: { validUntil: 'asc' },
        });
        return asos.map((aso) => {
            const validUntil = aso.validUntil;
            const signedAt = aso.signedAt ?? aso.request.createdAt;
            const daysUntilExpiration = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: aso.id,
                requestId: aso.requestId,
                collaborator: {
                    id: aso.request.patient.id,
                    name: aso.request.patient.name,
                    cpf: aso.request.patient.cpf,
                    functionCboCode: aso.request.patient.functionCboCode,
                },
                examType: aso.request.invite?.examType ?? aso.request.examPurpose,
                examPurpose: aso.request.examPurpose,
                issuedAt: signedAt.toISOString(),
                validUntil: validUntil.toISOString(),
                daysUntilExpiration,
                decision: aso.decision,
                restrictionNotes: aso.restrictionNotes,
                pdfUrl: aso.pdfUrl,
                doctor: {
                    id: aso.doctor.id,
                    name: aso.doctor.name,
                    crm: `${aso.doctor.crmNumber}/${aso.doctor.crmState}`,
                },
            };
        });
    }
    async getAsoPdf(companyId, asoId) {
        const aso = await this.prisma.asoDocument.findFirst({
            where: { id: asoId, request: { patient: { companies: { some: { companyId, endDate: null } } } } },
        });
        if (!aso?.pdfUrl)
            throw new common_1.NotFoundException('ASO nao encontrado');
        const fileName = (0, path_1.basename)(aso.pdfUrl);
        return { buffer: await this.storage.downloadAsoFile(fileName), fileName };
    }
    async cancelInvite(inviteId) {
        return this.prisma.examInvite.delete({
            where: { id: inviteId },
        });
    }
    async findInviteByCpf(cpf, user) {
        let clinicId = user.role === 'CLINIC' ? user.profileId : undefined;
        if (user.role === 'OPERATOR') {
            const operator = await this.prisma.operator.findUnique({
                where: { id: user.profileId ?? '' },
                select: { clinicId: true },
            });
            clinicId = operator?.clinicId;
        }
        if (user.role !== 'ADMIN' && !clinicId) {
            throw new common_1.ForbiddenException('Clinica nao identificada');
        }
        return this.prisma.examInvite.findFirst({
            where: {
                expectedCpf: cpf,
                status: { in: ['ENVIADO', 'ABERTO'] },
                ...(user.role === 'ADMIN' ? {} : { company: { clinicId } }),
            },
            orderBy: { createdAt: 'desc' },
            include: { company: true },
        });
    }
    async getInviteTimeline(inviteId) {
        const invite = await this.prisma.examInvite.findUnique({
            where: { id: inviteId },
            include: {
                timelineEvents: { orderBy: { occurredAt: 'asc' } },
                examRequest: {
                    include: { asoDocuments: true },
                },
            },
        });
        if (!invite)
            throw new Error('Invite not found');
        return {
            invite,
            timeline: invite.timelineEvents,
            finalResult: invite.examRequest?.asoDocuments?.[0]?.decision ?? null,
        };
    }
    async recordTimelineEvent(data) {
        return this.prisma.examTimelineEvent.create({
            data: {
                inviteId: data.inviteId,
                examRequestId: data.examRequestId,
                eventType: data.eventType,
            },
        });
    }
    async getDashboardStats(companyId) {
        const invites = await this.prisma.examInvite.findMany({
            where: { companyId },
            include: { examRequest: true },
        });
        const total = invites.length;
        const sent = invites.filter((i) => i.status === 'ENVIADO').length;
        const opened = invites.filter((i) => i.status === 'ABERTO').length;
        const inProgress = invites.filter((i) => i.examRequest && i.examRequest.status !== 'CONCLUIDO').length;
        const completed = invites.filter((i) => i.examRequest?.status === 'CONCLUIDO').length;
        const expired = invites.filter((i) => i.status === 'EXPIRADO' || new Date() > i.expiresAt).length;
        return { total, sent, opened, inProgress, completed, expired };
    }
    async getStatusCheck(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                razaoSocial: true,
                status: true,
                pcmsoDocumentUrl: true,
                ppraDocumentUrl: true,
                pcmsoValidUntil: true,
                ppraValidUntil: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
        if (!company)
            throw new Error('Empresa não encontrada');
        const now = new Date();
        return {
            hasRazaoSocial: !!company.razaoSocial,
            hasPcmso: !!company.pcmsoDocumentUrl,
            hasPpra: !!company.ppraDocumentUrl,
            pcmsoValid: !!company.pcmsoValidUntil && company.pcmsoValidUntil > now,
            ppraValid: !!company.ppraValidUntil && company.ppraValidUntil > now,
            hasClinicAssigned: !!company.clinicId,
            clinic: company.clinic
                ? {
                    id: company.clinic.id,
                    name: company.clinic.name,
                    address: company.clinic.address,
                    city: company.clinic.city,
                    state: company.clinic.state,
                }
                : null,
            status: company.status,
            isComplete: !!company.pcmsoValidUntil &&
                company.pcmsoValidUntil > now &&
                !!company.ppraValidUntil &&
                company.ppraValidUntil > now,
        };
    }
    async listInvitesForAllCompanies() {
        return this.prisma.examInvite.findMany({
            include: {
                timelineEvents: { orderBy: { occurredAt: 'asc' } },
                examRequest: { include: { results: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async gerarRelatorio(companyId, de, ate) {
        const where = {
            invite: { companyId },
        };
        if (de)
            where.createdAt = { ...where.createdAt, gte: new Date(de) };
        if (ate)
            where.createdAt = { ...where.createdAt, lte: new Date(ate) };
        const requests = await this.prisma.examRequest.findMany({
            where,
            include: {
                patient: true,
                asoDocuments: { orderBy: { signedAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });
        return requests.map((r) => [
            r.patient.name,
            r.patient.cpf,
            r.patient.functionCboCode ?? '',
            r.examPurpose,
            r.createdAt.toISOString().split('T')[0],
            r.asoDocuments[0]?.decision ?? '',
            r.asoDocuments[0]?.validUntil?.toISOString().split('T')[0] ?? '',
        ].map((value) => {
            const safeValue = String(value ?? '');
            return /[",;\n\r]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
        }).join(';'));
    }
    async findBestClinicForCompany(companyId, ignoreCurrentAssignment = false) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                city: true,
                state: true,
                lat: true,
                lng: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        isMatriz: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
        if (!company)
            throw new Error('Empresa não encontrada');
        if (!ignoreCurrentAssignment && company.clinicId && company.clinic?.isMatriz) {
            return company.clinic;
        }
        if (company.lat !== null && company.lng !== null) {
            const clinics = await this.prisma.clinic.findMany({
                where: { isActive: true, lat: { not: null }, lng: { not: null } },
            });
            const nearest = clinics
                .map((clinic) => ({
                clinic,
                distance: this.distanceKm(company.lat, company.lng, clinic.lat, clinic.lng),
            }))
                .sort((a, b) => a.distance - b.distance)[0];
            if (nearest && nearest.distance <= 100)
                return nearest.clinic;
        }
        const matrizSameCity = await this.prisma.clinic.findFirst({
            where: {
                isActive: true,
                isMatriz: true,
                city: company.city,
                state: company.state,
            },
            orderBy: { createdAt: 'asc' },
        });
        if (matrizSameCity)
            return matrizSameCity;
        const sameCity = await this.prisma.clinic.findFirst({
            where: {
                isActive: true,
                city: company.city,
                state: company.state,
            },
            orderBy: [{ isMatriz: 'desc' }, { createdAt: 'asc' }],
        });
        if (sameCity)
            return sameCity;
        const matrizSameState = await this.prisma.clinic.findFirst({
            where: {
                isActive: true,
                isMatriz: true,
                state: company.state,
            },
            orderBy: { createdAt: 'asc' },
        });
        if (matrizSameState)
            return matrizSameState;
        const anyClinic = await this.prisma.clinic.findFirst({
            where: { isActive: true },
            orderBy: [{ isMatriz: 'desc' }, { createdAt: 'asc' }],
        });
        if (anyClinic)
            return anyClinic;
        return null;
    }
    distanceKm(lat1, lng1, lat2, lng2) {
        const toRadians = (value) => (value * Math.PI) / 180;
        const a = Math.sin((toRadians(lat2) - toRadians(lat1)) / 2) ** 2 +
            Math.cos(toRadians(lat1)) *
                Math.cos(toRadians(lat2)) *
                Math.sin((toRadians(lng2) - toRadians(lng1)) / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway,
        mail_service_1.MailService,
        supabase_storage_service_1.SupabaseStorageService])
], CompanyService);
//# sourceMappingURL=company.service.js.map