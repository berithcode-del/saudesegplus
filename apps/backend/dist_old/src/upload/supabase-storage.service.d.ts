import { ConfigService } from '@nestjs/config';
export declare class SupabaseStorageService {
    private config;
    private client;
    constructor(config: ConfigService);
    private getExtension;
    uploadDocument(file: Express.Multer.File, companyId: string, type: string): Promise<{
        fileUrl: string;
        fileName: string;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        fileUrl: string;
        fileName: string;
    }>;
    uploadAsoPdf(filePath: string, asoId: string): Promise<{
        fileUrl: string;
        fileName: string;
    }>;
    downloadFile(folder: string, fileName: string): Promise<Buffer>;
    downloadAsoFile(fileName: string): Promise<Buffer>;
    deleteFile(fileUrl: string): Promise<void>;
}
