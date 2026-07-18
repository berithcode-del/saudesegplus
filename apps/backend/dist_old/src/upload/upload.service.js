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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const supabase_storage_service_1 = require("./supabase-storage.service");
let UploadService = class UploadService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async saveDocument(file, companyId, type, validUntil) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const { fileUrl, fileName } = await this.storage.uploadDocument(file, companyId, type);
        const doc = await this.prisma.companyDocument.create({
            data: {
                companyId,
                type,
                fileUrl,
                originalName: file.originalname,
                validUntil: validUntil ? new Date(validUntil) : null,
            },
        });
        const updateData = {};
        if (type === 'PCMSO') {
            updateData.pcmsoDocumentUrl = fileUrl;
            updateData.pcmsoValidUntil = new Date(validUntil);
        }
        if (type === 'PPRA') {
            updateData.ppraDocumentUrl = fileUrl;
            updateData.ppraValidUntil = new Date(validUntil);
        }
        if (Object.keys(updateData).length > 0) {
            const current = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { status: true },
            });
            if (current?.status === 'CADASTRO_INCOMPLETO') {
                updateData.status = 'EM_ANALISE';
            }
            await this.prisma.company.update({
                where: { id: companyId },
                data: updateData,
            });
        }
        return doc;
    }
    async uploadFile(file) {
        const { fileUrl, fileName } = await this.storage.uploadFile(file);
        return { fileUrl, fileName };
    }
    async listDocuments(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        return this.prisma.companyDocument.findMany({
            where: { companyId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async getDocumentFile(companyId, fileName) {
        if (!/^[0-9a-f-]{36}\.pdf$/i.test(fileName)) {
            throw new common_1.NotFoundException('Documento não encontrado');
        }
        const document = await this.prisma.companyDocument.findFirst({
            where: {
                companyId,
                fileUrl: { endsWith: fileName },
            },
        });
        if (!document)
            throw new common_1.NotFoundException('Documento não encontrado');
        try {
            const buffer = await this.storage.downloadFile(`documents/${companyId}/${document.type}`, fileName);
            return {
                buffer,
                originalName: document.originalName,
            };
        }
        catch {
            throw new common_1.NotFoundException('Documento não encontrado');
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_storage_service_1.SupabaseStorageService])
], UploadService);
//# sourceMappingURL=upload.service.js.map