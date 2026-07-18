import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from './supabase-storage.service';
export declare class UploadService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: SupabaseStorageService);
    saveDocument(file: Express.Multer.File, companyId: string, type: string, validUntil: string): Promise<{
        id: string;
        type: string;
        companyId: string;
        fileUrl: string;
        validUntil: Date | null;
        originalName: string;
        uploadedAt: Date;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        fileUrl: string;
        fileName: string;
    }>;
    listDocuments(companyId: string): Promise<{
        id: string;
        type: string;
        companyId: string;
        fileUrl: string;
        validUntil: Date | null;
        originalName: string;
        uploadedAt: Date;
    }[]>;
    getDocumentFile(companyId: string, fileName: string): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        originalName: string;
    }>;
}
