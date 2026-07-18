import type { Response } from 'express';
import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadDocument(file: Express.Multer.File, companyId: string, type: string, validUntil: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            type: string;
            companyId: string;
            fileUrl: string;
            validUntil: Date | null;
            originalName: string;
            uploadedAt: Date;
        };
        message?: undefined;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
    } | {
        fileUrl: string;
        fileName: string;
        success: boolean;
        message?: undefined;
    }>;
    uploadExamFile(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
    } | {
        fileUrl: string;
        fileName: string;
        success: boolean;
        message?: undefined;
    }>;
    listDocuments(companyId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            type: string;
            companyId: string;
            fileUrl: string;
            validUntil: Date | null;
            originalName: string;
            uploadedAt: Date;
        }[];
    }>;
    downloadDocument(companyId: string, fileName: string, response: Response): Promise<void>;
}
