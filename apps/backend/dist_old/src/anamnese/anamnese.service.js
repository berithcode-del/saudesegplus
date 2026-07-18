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
exports.AnamneseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AnamneseService = class AnamneseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByPatient(patientId) {
        return this.prisma.anamnese.findFirst({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async upsert(patientId, data) {
        const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException('Paciente não encontrado');
        const existing = await this.prisma.anamnese.findFirst({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
        if (existing) {
            return this.prisma.anamnese.update({
                where: { id: existing.id },
                data,
            });
        }
        return this.prisma.anamnese.create({
            data: { patientId, ...data },
        });
    }
};
exports.AnamneseService = AnamneseService;
exports.AnamneseService = AnamneseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnamneseService);
//# sourceMappingURL=anamnese.service.js.map