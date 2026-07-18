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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeGender(gender) {
        if (gender === 'male' || gender === 'female')
            return gender;
        return null;
    }
    async getCompanies(status) {
        return this.prisma.company.findMany({
            where: status ? { status } : undefined,
            include: {
                clinic: true,
                admins: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCompanyById(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                clinic: true,
                admins: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
                patients: { include: { patient: true } },
                examInvites: { orderBy: { createdAt: 'desc' }, take: 20 },
                documents: true,
            },
        });
        if (!company)
            throw new common_1.NotFoundException('Empresa não encontrada');
        return {
            ...company,
            accessEmail: company.admins[0]?.user.email ?? null,
        };
    }
    async updateCompany(id, data) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { admins: { orderBy: { createdAt: 'asc' }, take: 1 } },
        });
        if (!company)
            throw new common_1.NotFoundException('Empresa não encontrada');
        const { accessEmail, ...profileData } = data;
        const companyData = {
            ...profileData,
            ...(profileData.cnpj
                ? { cnpj: profileData.cnpj.replace(/\D/g, '') }
                : {}),
            ...(profileData.contactEmail
                ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
                : {}),
            status: profileData.status,
        };
        try {
            return await this.prisma.$transaction(async (tx) => {
                if (accessEmail && company.admins[0]) {
                    await tx.userAccount.update({
                        where: { id: company.admins[0].userId },
                        data: { email: accessEmail.trim().toLowerCase() },
                    });
                }
                return tx.company.update({ where: { id }, data: companyData });
            });
        }
        catch (error) {
            this.rethrowUniqueConflict(error, 'CNPJ ou e-mail já cadastrado');
        }
    }
    async deleteCompany(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { admins: true },
        });
        if (!company)
            throw new common_1.NotFoundException('Empresa não encontrada');
        await this.prisma.examTimelineEvent.deleteMany({
            where: { invite: { companyId: id } },
        });
        await this.prisma.examInvite.deleteMany({ where: { companyId: id } });
        await this.prisma.companyDocument.deleteMany({ where: { companyId: id } });
        await this.prisma.companyPatientRelation.deleteMany({
            where: { companyId: id },
        });
        await this.prisma.calendarEvent.deleteMany({ where: { companyId: id } });
        await this.prisma.financialTransaction.deleteMany({
            where: { companyId: id },
        });
        const adminUserIds = company.admins.map((a) => a.userId);
        await this.prisma.companyAdmin.deleteMany({ where: { companyId: id } });
        await this.prisma.company.delete({ where: { id } });
        if (adminUserIds.length > 0) {
            await this.prisma.userAccount.deleteMany({
                where: { id: { in: adminUserIds } },
            });
        }
        return { success: true };
    }
    async getClinics() {
        return this.prisma.clinic.findMany({
            include: {
                companies: true,
                operators: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getClinicById(id) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            include: {
                companies: true,
                user: { select: { id: true, email: true } },
                operators: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
                examRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!clinic)
            throw new common_1.NotFoundException('Clínica não encontrada');
        return {
            ...clinic,
            accessEmail: clinic.user?.email ?? null,
        };
    }
    async createClinic(data) {
        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const email = data.email ??
            `clinica.${data.cnpj.replace(/\D/g, '').slice(0, 8)}@saudeseg.com`;
        const existingUser = await this.prisma.userAccount.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const user = await this.prisma.userAccount.create({
            data: {
                email,
                passwordHash,
                role: 'CLINIC',
                clinicProfile: {
                    create: {
                        name: data.name,
                        cnpj: data.cnpj,
                        city: data.city ?? null,
                        state: data.state ?? null,
                        address: data.address ?? null,
                    },
                },
            },
            include: { clinicProfile: true },
        });
        return { ...user.clinicProfile, email: user.email, tempPassword };
    }
    async updateClinic(id, data) {
        const clinic = await this.prisma.clinic.findUnique({ where: { id } });
        if (!clinic)
            throw new common_1.NotFoundException('Clínica não encontrada');
        const { accessEmail, ...profileData } = data;
        const clinicData = {
            ...profileData,
            ...(profileData.cnpj
                ? { cnpj: profileData.cnpj.replace(/\D/g, '') }
                : {}),
            ...(profileData.contactEmail
                ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
                : {}),
        };
        try {
            return await this.prisma.$transaction(async (tx) => {
                if (accessEmail && clinic.userId) {
                    await tx.userAccount.update({
                        where: { id: clinic.userId },
                        data: { email: accessEmail.trim().toLowerCase() },
                    });
                }
                return tx.clinic.update({ where: { id }, data: clinicData });
            });
        }
        catch (error) {
            this.rethrowUniqueConflict(error, 'CNPJ ou e-mail já cadastrado');
        }
    }
    async deleteClinic(id) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            include: { operators: true },
        });
        if (!clinic)
            throw new common_1.NotFoundException('Clínica não encontrada');
        await this.prisma.calendarEvent.deleteMany({ where: { clinicId: id } });
        await this.prisma.financialTransaction.deleteMany({
            where: { clinicId: id },
        });
        const operatorUserIds = clinic.operators.map((o) => o.userId);
        await this.prisma.operator.deleteMany({ where: { clinicId: id } });
        const clinicUserId = clinic.userId;
        await this.prisma.clinic.delete({ where: { id } });
        if (operatorUserIds.length > 0) {
            await this.prisma.userAccount.deleteMany({
                where: { id: { in: operatorUserIds } },
            });
        }
        if (clinicUserId) {
            await this.prisma.userAccount.delete({ where: { id: clinicUserId } });
        }
        return { success: true };
    }
    async setClinicAsMatriz(id, setAsMatriz) {
        const clinic = await this.prisma.clinic.findUnique({ where: { id } });
        if (!clinic)
            throw new common_1.NotFoundException('Clínica não encontrada');
        if (setAsMatriz) {
            await this.prisma.clinic.updateMany({
                where: {
                    isMatriz: true,
                    state: clinic.state,
                    NOT: { id },
                },
                data: { isMatriz: false },
            });
        }
        return this.prisma.clinic.update({
            where: { id },
            data: { isMatriz: setAsMatriz },
            include: {
                companies: true,
                operators: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
            },
        });
    }
    slugifyName(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '.');
    }
    async getDoctors() {
        return this.prisma.doctor.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async getDoctorById(id) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: {
                user: { select: { email: true, createdAt: true } },
                teleconsultations: { orderBy: { startedAt: 'desc' }, take: 10 },
                asoDocuments: { orderBy: { signedAt: 'desc' }, take: 10 },
            },
        });
        if (!doctor)
            throw new common_1.NotFoundException('Médico não encontrado');
        return {
            ...doctor,
            accessEmail: doctor.user.email,
        };
    }
    async createDoctor(data) {
        const existing = await this.prisma.doctor.findUnique({
            where: { crmNumber: data.crmNumber },
        });
        if (existing)
            throw new common_1.ConflictException('CRM já cadastrado');
        const email = data.email ?? `${this.slugifyName(data.name)}@saudeseg.com`;
        const gender = this.normalizeGender(data.gender);
        const existingUser = await this.prisma.userAccount.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const user = await this.prisma.userAccount.create({
            data: {
                email,
                passwordHash,
                role: 'DOCTOR',
                doctorProfile: {
                    create: {
                        name: data.name,
                        gender,
                        crmNumber: data.crmNumber,
                        crmState: data.crmState,
                        city: data.city ?? null,
                        state: data.state ?? null,
                        specialties: data.specialties ?? null,
                    },
                },
            },
            include: { doctorProfile: true },
        });
        return { ...user.doctorProfile, email, tempPassword };
    }
    async updateDoctor(id, data) {
        const doctor = await this.prisma.doctor.findUnique({ where: { id } });
        if (!doctor)
            throw new common_1.NotFoundException('Médico não encontrado');
        const { accessEmail, ...profileData } = data;
        const doctorData = {
            ...profileData,
            ...(profileData.gender !== undefined
                ? { gender: this.normalizeGender(profileData.gender) }
                : {}),
            ...(profileData.crmNumber
                ? { crmNumber: profileData.crmNumber.trim() }
                : {}),
            ...(profileData.contactEmail
                ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
                : {}),
        };
        try {
            return await this.prisma.$transaction(async (tx) => {
                if (accessEmail) {
                    await tx.userAccount.update({
                        where: { id: doctor.userId },
                        data: { email: accessEmail.trim().toLowerCase() },
                    });
                }
                return tx.doctor.update({ where: { id }, data: doctorData });
            });
        }
        catch (error) {
            this.rethrowUniqueConflict(error, 'CRM ou e-mail já cadastrado');
        }
    }
    rethrowUniqueConflict(error, message) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002') {
            throw new common_1.ConflictException(message);
        }
        throw error;
    }
    async verifyDoctor(doctorId) {
        return this.prisma.doctor.update({
            where: { id: doctorId },
            data: { verifiedAt: new Date() },
        });
    }
    async deleteDoctor(id) {
        const doctor = await this.prisma.doctor.findUnique({ where: { id } });
        if (!doctor)
            throw new common_1.NotFoundException('Médico não encontrado');
        await this.prisma.asoDocument.deleteMany({ where: { doctorId: id } });
        await this.prisma.teleconsultation.deleteMany({ where: { doctorId: id } });
        await this.prisma.calendarEvent.deleteMany({ where: { doctorId: id } });
        await this.prisma.financialTransaction.deleteMany({
            where: { doctorId: id },
        });
        await this.prisma.doctor.delete({ where: { id } });
        await this.prisma.userAccount.delete({ where: { id: doctor.userId } });
        return { success: true };
    }
    async getStats() {
        const [companies, patients, examRequests, asos, financial] = await Promise.all([
            this.prisma.company.count(),
            this.prisma.patient.count(),
            this.prisma.examRequest.count(),
            this.prisma.asoDocument.count(),
            this.prisma.financialTransaction.groupBy({
                by: ['type', 'status'],
                _sum: { amount: true },
            }),
        ]);
        let receita = 0;
        let repasses = 0;
        let pendente = 0;
        let despesas = 0;
        for (const f of financial) {
            const val = f._sum.amount || 0;
            if (f.type === 'RECEITA' && f.status === 'PAGO')
                receita += val;
            if (f.type === 'REPASSE' && f.status === 'PAGO')
                repasses += val;
            if (f.type === 'DESPESA' && f.status === 'PAGO')
                despesas += val;
            if (f.type === 'RECEITA' && f.status === 'PENDENTE')
                pendente += val;
        }
        return {
            totalCompanies: companies,
            totalPatients: patients,
            totalSolicitacoes: examRequests,
            totalAsoEmitidos: asos,
            financial: {
                receita,
                repasses,
                pendente,
                lucro: receita - repasses - despesas,
            },
        };
    }
    async approveCompanyDocumentation(companyId, approvedBy) {
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
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const now = new Date();
        const pcmsoValid = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
        const ppraValid = company.ppraValidUntil && company.ppraValidUntil > now;
        if (!pcmsoValid || !ppraValid) {
            throw new common_1.BadRequestException(`Documentação incompleta. PCMSO válido: ${pcmsoValid ? 'sim' : 'não'}, PPRA válido: ${ppraValid ? 'sim' : 'não'}`);
        }
        await this.prisma.company.update({
            where: { id: companyId },
            data: {
                status: 'LIBERADA',
                updatedAt: now,
            },
        });
        return {
            success: true,
            message: `Empresa ${company.razaoSocial} aprovada e liberada para operação.`,
            companyId: company.id,
            approvedAt: now,
            approvedBy,
        };
    }
    async getCompaniesPendingApproval() {
        return this.prisma.company.findMany({
            where: {
                status: { in: ['CADASTRO_INCOMPLETO', 'EM_ANALISE'] },
            },
            include: {
                documents: {
                    where: {
                        type: { in: ['PCMSO', 'PPRA'] },
                    },
                    orderBy: { uploadedAt: 'desc' },
                },
                admins: {
                    include: { user: { select: { id: true, email: true, role: true } } },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map