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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const upload_service_1 = require("./upload.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const company_scope_guard_1 = require("../auth/company-scope.guard");
const portal_session_guard_1 = require("../portal/portal-session.guard");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const throttler_1 = require("@nestjs/throttler");
const PDF_MIME_TYPES = new Set(['application/pdf']);
const PORTAL_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
]);
function allowMimeTypes(allowed) {
    return (_request, file, callback) => {
        if (!allowed.has(file.mimetype)) {
            callback(new common_1.BadRequestException('Tipo de arquivo nao permitido'), false);
            return;
        }
        callback(null, true);
    };
}
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async uploadDocument(file, companyId, type, validUntil) {
        const normalizedType = type?.trim().toUpperCase() === 'PGR'
            ? 'PPRA'
            : type?.trim().toUpperCase();
        if (!file) {
            return { success: false, message: 'Arquivo nao enviado' };
        }
        if (!normalizedType || !['PCMSO', 'PPRA'].includes(normalizedType)) {
            return { success: false, message: 'Tipo deve ser PCMSO, PPRA ou PGR' };
        }
        if (file.mimetype !== 'application/pdf') {
            return {
                success: false,
                message: 'Apenas arquivos PDF sao aceitos para documentos',
            };
        }
        if (file.buffer.length < 100) {
            return {
                success: false,
                message: 'Arquivo PDF muito pequeno ou inválido',
            };
        }
        const pdfHeader = file.buffer.subarray(0, 5).toString();
        if (pdfHeader !== '%PDF-') {
            return {
                success: false,
                message: 'Arquivo não é um PDF válido (header inválido)',
            };
        }
        const doc = await this.uploadService.saveDocument(file, companyId, normalizedType, validUntil);
        return { success: true, data: doc };
    }
    async uploadFile(file) {
        if (!file) {
            return { success: false, message: 'Arquivo nao enviado' };
        }
        const data = await this.uploadService.uploadFile(file);
        return { success: true, ...data };
    }
    async uploadExamFile(file) {
        if (!file) {
            return { success: false, message: 'Arquivo nao enviado' };
        }
        const data = await this.uploadService.uploadFile(file);
        return { success: true, ...data };
    }
    async listDocuments(companyId) {
        const docs = await this.uploadService.listDocuments(companyId);
        return { success: true, data: docs };
    }
    async downloadDocument(companyId, fileName, response) {
        const file = await this.uploadService.getDocumentFile(companyId, fileName);
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `inline; filename="${file.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
        response.send(file.buffer);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('document'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024, files: 1 },
        fileFilter: allowMimeTypes(PDF_MIME_TYPES),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('companyId')),
    __param(2, (0, common_1.Body)('type')),
    __param(3, (0, common_1.Body)('validUntil')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadDocument", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('file'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.UseGuards)(portal_session_guard_1.PortalSessionGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 8 * 1024 * 1024, files: 1 },
        fileFilter: allowMimeTypes(PORTAL_MIME_TYPES),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('exam-file'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    (0, roles_decorator_1.Roles)('ADMIN', 'CLINIC', 'OPERATOR'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 8 * 1024 * 1024, files: 1 },
        fileFilter: allowMimeTypes(PORTAL_MIME_TYPES),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadExamFile", null);
__decorate([
    (0, common_1.Get)('documents/:companyId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:companyId/file/:fileName'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN'),
    (0, common_1.UseGuards)(company_scope_guard_1.CompanyScopeGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('fileName')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "downloadDocument", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('api/upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map