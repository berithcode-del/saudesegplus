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
exports.SignatureService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma.service");
let SignatureService = class SignatureService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAuthenticatedDoctor(userId) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
        if (!doctor)
            throw new common_1.UnauthorizedException('Perfil médico não encontrado');
        return doctor;
    }
    async generateLink(examRequestId, userId) {
        const doctor = await this.getAuthenticatedDoctor(userId);
        const request = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: { queueEntry: true },
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada');
        if (request.queueEntry?.assignedDoctorId &&
            request.queueEntry.assignedDoctorId !== doctor.id) {
            throw new common_1.ForbiddenException('Esta solicitação está atribuída a outro médico');
        }
        const pendingDocument = await this.prisma.asoDocument.findFirst({
            where: { requestId: examRequestId, doctorId: doctor.id, signedAt: null },
            orderBy: { id: 'desc' },
        });
        const asoDoc = pendingDocument ??
            (await this.prisma.asoDocument.create({
                data: {
                    requestId: examRequestId,
                    doctorId: doctor.id,
                    decision: 'PENDENTE',
                    signatureProviderId: `mock_provider_${Date.now()}`,
                },
            }));
        return {
            url: `/api/signature/sign/${asoDoc.id}`,
            asoDocumentId: asoDoc.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
    }
    async signDocument(asoDocumentId, userId, pin) {
        if (!/^\d{4}$/.test(pin)) {
            throw new common_1.BadRequestException('O PIN deve conter exatamente 4 dígitos');
        }
        const doctor = await this.getAuthenticatedDoctor(userId);
        const doc = await this.prisma.asoDocument.findUnique({
            where: { id: asoDocumentId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Documento não encontrado');
        if (doc.doctorId !== doctor.id) {
            throw new common_1.ForbiddenException('Você não pode assinar este documento');
        }
        if (!doctor.signaturePin) {
            throw new common_1.BadRequestException('Cadastre seu PIN em Configurações');
        }
        if (!(await bcrypt.compare(pin, doctor.signaturePin))) {
            throw new common_1.BadRequestException('PIN incorreto');
        }
        const updated = await this.prisma.asoDocument.update({
            where: { id: asoDocumentId },
            data: { signedAt: new Date() },
        });
        return {
            success: true,
            signedAt: updated.signedAt,
            provider: 'mock',
            message: 'Assinatura mock concluída; a integração A3 substituirá esta etapa futuramente.',
        };
    }
    async handleWebhook(payload, providedSecret) {
        const expectedSecret = process.env.SIGNATURE_WEBHOOK_SECRET;
        if (!expectedSecret ||
            !providedSecret ||
            expectedSecret.length !== providedSecret.length ||
            !(0, crypto_1.timingSafeEqual)(Buffer.from(expectedSecret), Buffer.from(providedSecret))) {
            throw new common_1.UnauthorizedException('Webhook de assinatura não autorizado');
        }
        await this.prisma.asoDocument.update({
            where: { id: payload.document_id },
            data: { signedAt: new Date(payload.signed_at) },
        });
        console.log(`[Webhook] Documento ${payload.document_id} assinado em ${payload.signed_at}`);
        return { success: true };
    }
};
exports.SignatureService = SignatureService;
exports.SignatureService = SignatureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SignatureService);
//# sourceMappingURL=signature.service.js.map