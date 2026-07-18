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
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
let SupabaseStorageService = class SupabaseStorageService {
    config;
    client;
    constructor(config) {
        this.config = config;
        const url = this.config.get('SUPABASE_URL');
        const key = this.config.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
        }
        this.client = (0, supabase_js_1.createClient)(url, key);
    }
    getExtension(mimetype) {
        const map = {
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/png': 'png',
        };
        return map[mimetype] || 'bin';
    }
    async uploadDocument(file, companyId, type) {
        const fileName = `${(0, crypto_1.randomUUID)()}.pdf`;
        const path = `documents/${companyId}/${type}/${fileName}`;
        const { error } = await this.client.storage
            .from('company-documents')
            .upload(path, file.buffer, {
            contentType: 'application/pdf',
            upsert: false,
        });
        if (error)
            throw new common_1.BadRequestException(`Erro ao fazer upload: ${error.message}`);
        const { data } = this.client.storage
            .from('company-documents')
            .getPublicUrl(path);
        return { fileUrl: data.publicUrl, fileName };
    }
    async uploadFile(file) {
        const extension = this.getExtension(file.mimetype);
        const fileName = `${(0, crypto_1.randomUUID)()}.${extension}`;
        const path = `uploads/${fileName}`;
        const { error } = await this.client.storage
            .from('patient-files')
            .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error)
            throw new common_1.BadRequestException(`Erro ao fazer upload: ${error.message}`);
        const { data } = this.client.storage
            .from('patient-files')
            .getPublicUrl(path);
        return { fileUrl: data.publicUrl, fileName };
    }
    async uploadAsoPdf(filePath, asoId) {
        const fileName = `aso-${asoId}.pdf`;
        const path = `aso/${fileName}`;
        const fileBuffer = fs.readFileSync(filePath);
        const { error } = await this.client.storage
            .from('aso-documents')
            .upload(path, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true,
        });
        if (error)
            throw new common_1.BadRequestException(`Erro ao fazer upload do ASO: ${error.message}`);
        const { data } = this.client.storage
            .from('aso-documents')
            .getPublicUrl(path);
        return { fileUrl: data.publicUrl, fileName };
    }
    async downloadFile(folder, fileName) {
        const path = `${folder}/${fileName}`;
        const bucket = folder.startsWith('documents/')
            ? 'company-documents'
            : 'patient-files';
        const { data, error } = await this.client.storage
            .from(bucket)
            .download(path);
        if (error || !data)
            throw new common_1.NotFoundException('Arquivo não encontrado no storage');
        return Buffer.from(await data.arrayBuffer());
    }
    async downloadAsoFile(fileName) {
        const path = `aso/${fileName}`;
        const { data, error } = await this.client.storage
            .from('aso-documents')
            .download(path);
        if (error || !data)
            throw new common_1.NotFoundException('ASO não encontrado no storage');
        return Buffer.from(await data.arrayBuffer());
    }
    async deleteFile(fileUrl) {
        try {
            const url = new URL(fileUrl);
            const pathParts = url.pathname.split('/storage/v1/object/public/');
            if (pathParts.length < 2)
                return;
            const [bucket, ...pathSegments] = pathParts[1].split('/');
            const path = pathSegments.join('/');
            await this.client.storage.from(bucket).remove([path]);
        }
        catch {
        }
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map