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
exports.MedicosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const pagination_1 = require("../common/pagination");
const bcrypt = __importStar(require("bcrypt"));
let MedicosService = class MedicosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(filters, page = 1, limit = 20) {
        const where = {
            OR: filters.search
                ? [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { crmNumber: { contains: filters.search, mode: 'insensitive' } },
                    { specialties: { contains: filters.search, mode: 'insensitive' } },
                ]
                : undefined,
            city: filters.city,
            state: filters.state,
            verifiedAt: { not: null },
        };
        return (0, pagination_1.paginate)(this.prisma.doctor, page, limit, {
            where,
            select: {
                id: true,
                name: true,
                gender: true,
                crmNumber: true,
                crmState: true,
                city: true,
                state: true,
                specialties: true,
                status: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async getProfile(doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
            select: {
                id: true,
                name: true,
                gender: true,
                crmNumber: true,
                crmState: true,
                city: true,
                state: true,
                specialties: true,
                status: true,
                verifiedAt: true,
                rqeNumber: true,
                phone: true,
                contactEmail: true,
                user: { select: { email: true } },
            },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Médico não encontrado');
        }
        return {
            ...doctor,
            email: doctor.user?.email ?? null,
        };
    }
    async updateProfile(userId, doctorId, body) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
        });
        if (!doctor)
            throw new common_1.NotFoundException('Médico não encontrado');
        if (doctor.userId !== userId)
            throw new common_1.ForbiddenException('Você só pode editar seu próprio perfil');
        const updateData = {};
        if (body.city !== undefined)
            updateData.city = body.city;
        if (body.state !== undefined)
            updateData.state = body.state;
        if (body.phone !== undefined)
            updateData.phone = body.phone.trim();
        if (body.contactEmail !== undefined) {
            updateData.contactEmail = body.contactEmail.trim().toLowerCase();
        }
        const updated = await this.prisma.doctor.update({
            where: { id: doctorId },
            data: updateData,
        });
        return updated;
    }
    async setSignaturePin(userId, currentPassword, pin) {
        if (!currentPassword) {
            throw new common_1.BadRequestException('Informe sua senha atual');
        }
        if (!/^\d{4}$/.test(pin)) {
            throw new common_1.BadRequestException('O PIN deve conter exatamente 4 dígitos');
        }
        const user = await this.prisma.userAccount.findUnique({
            where: { id: userId },
            include: { doctorProfile: true },
        });
        if (!user?.doctorProfile) {
            throw new common_1.UnauthorizedException('Perfil médico não encontrado');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Senha atual incorreta');
        }
        await this.prisma.doctor.update({
            where: { id: user.doctorProfile.id },
            data: { signaturePin: await bcrypt.hash(pin, 10) },
        });
        return {
            success: true,
            message: 'PIN de assinatura cadastrado com sucesso',
        };
    }
    async listSolicitacoes(doctorId, startDate, endDate) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Médico não encontrado');
        }
        const whereQueue = {
            assignedDoctorId: doctorId,
        };
        if (startDate || endDate) {
            whereQueue.assignedAt = {};
            if (startDate) {
                whereQueue.assignedAt.gte = new Date(startDate);
            }
            if (endDate) {
                whereQueue.assignedAt.lte = new Date(endDate);
            }
        }
        const queueEntries = await this.prisma.queueEntry.findMany({
            where: whereQueue,
            include: {
                request: {
                    include: {
                        patient: true,
                        clinic: true,
                        invite: { include: { company: true } },
                        results: { include: { type: true } },
                        asoDocuments: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
        return queueEntries
            .filter((entry) => entry.request)
            .map((entry) => ({
            ...entry.request,
            queueStatus: entry.status,
            enteredQueueAt: entry.enteredQueueAt,
            assignedAt: entry.assignedAt,
        }));
    }
};
exports.MedicosService = MedicosService;
exports.MedicosService = MedicosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MedicosService);
//# sourceMappingURL=medicos.service.js.map