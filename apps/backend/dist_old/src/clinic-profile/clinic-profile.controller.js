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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicProfileController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const update_clinic_profile_dto_1 = require("./dto/update-clinic-profile.dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ClinicProfileController = class ClinicProfileController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listClinics(query) {
        const { state, city } = query;
        if (!state)
            return { success: true, data: [] };
        const where = { isActive: true, state };
        if (city)
            where.city = city;
        const clinics = await this.prisma.clinic.findMany({
            where,
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
                isMatriz: true,
                parentClinicId: true,
            },
            orderBy: [{ isMatriz: 'desc' }, { name: 'asc' }],
        });
        return { success: true, data: clinics };
    }
    async getProfile(req) {
        const userId = req.user.sub;
        const user = await this.prisma.userAccount.findUnique({
            where: { id: userId },
            include: { clinicProfile: true, operatorProfile: { include: { clinic: true } } },
        });
        const clinic = user?.clinicProfile ?? user?.operatorProfile?.clinic;
        if (!clinic) {
            return null;
        }
        return {
            id: clinic.id,
            name: clinic.name,
            cnpj: clinic.cnpj,
            address: clinic.address,
            city: clinic.city,
            state: clinic.state,
            phone: clinic.phone,
            contactEmail: clinic.contactEmail,
            email: user.clinicProfile ? user.email : null,
            operatorName: user.operatorProfile?.name ?? null,
            operatorEmail: user.operatorProfile ? user.email : null,
        };
    }
    async updateProfile(req, body) {
        const userId = req.user.sub;
        const user = await this.prisma.userAccount.findUnique({
            where: { id: userId },
            include: { clinicProfile: true, operatorProfile: { select: { clinicId: true } } },
        });
        if (!user?.clinicProfile) {
            return { success: false, message: 'Perfil de clínica não encontrado' };
        }
        await this.prisma.clinic.update({
            where: { id: user.clinicProfile.id },
            data: {
                ...(body.address !== undefined ? { address: body.address } : {}),
                ...(body.city !== undefined ? { city: body.city } : {}),
                ...(body.state !== undefined ? { state: body.state } : {}),
                ...(body.phone !== undefined ? { phone: body.phone } : {}),
                ...(body.contactEmail !== undefined
                    ? { contactEmail: body.contactEmail }
                    : {}),
            },
        });
        return { success: true };
    }
    async getOwnClinicId(userId) {
        const user = await this.prisma.userAccount.findUnique({
            where: { id: userId },
            include: { clinicProfile: true, operatorProfile: { select: { clinicId: true } } },
        });
        return user?.clinicProfile?.id ?? user?.operatorProfile?.clinicId ?? null;
    }
    async listOperators(req) {
        const clinicId = await this.getOwnClinicId(req.user.sub);
        if (!clinicId)
            return { success: true, data: [] };
        const operators = await this.prisma.operator.findMany({
            where: { clinicId },
            include: {
                user: {
                    select: { id: true, email: true, role: true, createdAt: true },
                },
            },
            orderBy: { user: { email: 'asc' } },
        });
        return { success: true, data: operators };
    }
    async createOperator(req, body) {
        const clinicId = await this.getOwnClinicId(req.user.sub);
        if (!clinicId)
            throw new common_1.NotFoundException('Perfil de clínica não encontrado');
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { name: true },
        });
        if (!clinic)
            throw new common_1.NotFoundException('Clínica não encontrada');
        const operatorName = body.name?.trim();
        if (!operatorName) {
            throw new common_1.BadRequestException('Nome do operador e obrigatorio');
        }
        const clinicSlug = clinic.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .replace(/^(.{0,20}).*/, '$1');
        const operatorCount = await this.prisma.operator.count({
            where: { clinicId },
        });
        const suffix = operatorCount + 1;
        const email = `operador${suffix}@${clinicSlug}.com`;
        const existingUser = await this.prisma.userAccount.findUnique({
            where: { email },
        });
        if (existingUser)
            throw new common_1.ConflictException('E-mail já cadastrado. Tente novamente.');
        const password = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.prisma.userAccount.create({
            data: {
                email,
                passwordHash,
                role: 'OPERATOR',
                operatorProfile: {
                    create: { clinicId, name: operatorName },
                },
            },
            include: { operatorProfile: true },
        });
        return {
            success: true,
            data: {
                id: user.operatorProfile?.id,
                name: user.operatorProfile?.name,
                email: user.email,
                tempPassword: password,
            },
        };
    }
    async updateOperator(req, operatorId, body) {
        const clinicId = await this.getOwnClinicId(req.user.sub);
        if (!clinicId)
            throw new common_1.NotFoundException('Perfil de clínica não encontrado');
        const operator = await this.prisma.operator.findUnique({
            where: { id: operatorId },
            include: { user: true },
        });
        if (!operator || operator.clinicId !== clinicId) {
            throw new common_1.NotFoundException('Operador não encontrado');
        }
        if (body.email) {
            const email = String(body.email).trim().toLowerCase();
            const emailTaken = await this.prisma.userAccount.findFirst({
                where: { email, id: { not: operator.userId } },
            });
            if (emailTaken)
                throw new common_1.ConflictException('E-mail já cadastrado');
            await this.prisma.userAccount.update({
                where: { id: operator.userId },
                data: { email },
            });
        }
        if (body.password) {
            const passwordHash = await bcrypt.hash(body.password, 12);
            await this.prisma.userAccount.update({
                where: { id: operator.userId },
                data: { passwordHash },
            });
        }
        return { success: true };
    }
    async deleteOperator(req, operatorId) {
        const clinicId = await this.getOwnClinicId(req.user.sub);
        if (!clinicId)
            throw new common_1.NotFoundException('Perfil de clínica não encontrado');
        const operator = await this.prisma.operator.findUnique({
            where: { id: operatorId },
        });
        if (!operator || operator.clinicId !== clinicId) {
            throw new common_1.NotFoundException('Operador não encontrado');
        }
        const examResultsCount = await this.prisma.examResult.count({
            where: { collectedById: operatorId },
        });
        if (examResultsCount > 0) {
            throw new common_1.BadRequestException('Não é possível remover um operador que já registrou exames. Atribua os registros a outro operador antes de remover.');
        }
        const userId = operator.userId;
        await this.prisma.operator.delete({ where: { id: operatorId } });
        await this.prisma.userAccount.delete({ where: { id: userId } });
        return { success: true };
    }
};
exports.ClinicProfileController = ClinicProfileController;
__decorate([
    (0, common_1.Get)('clinics'),
    (0, roles_decorator_1.Roles)('CLINIC', 'COMPANY_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "listClinics", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)('CLINIC', 'OPERATOR'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, roles_decorator_1.Roles)('CLINIC'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_clinic_profile_dto_1.UpdateClinicProfileDto]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('operators'),
    (0, roles_decorator_1.Roles)('CLINIC'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "listOperators", null);
__decorate([
    (0, common_1.Post)('operators'),
    (0, roles_decorator_1.Roles)('CLINIC'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "createOperator", null);
__decorate([
    (0, common_1.Patch)('operators/:id'),
    (0, roles_decorator_1.Roles)('CLINIC'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "updateOperator", null);
__decorate([
    (0, common_1.Delete)('operators/:id'),
    (0, roles_decorator_1.Roles)('CLINIC'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ClinicProfileController.prototype, "deleteOperator", null);
exports.ClinicProfileController = ClinicProfileController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/clinic'),
    (0, roles_decorator_1.Roles)('CLINIC', 'OPERATOR'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClinicProfileController);
//# sourceMappingURL=clinic-profile.controller.js.map