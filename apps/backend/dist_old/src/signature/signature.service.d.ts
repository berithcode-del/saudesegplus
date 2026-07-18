import { PrismaService } from '../prisma.service';
export declare class SignatureService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getAuthenticatedDoctor;
    generateLink(examRequestId: string, userId: string): Promise<{
        url: string;
        asoDocumentId: string;
        expiresAt: string;
    }>;
    signDocument(asoDocumentId: string, userId: string, pin: string): Promise<{
        success: boolean;
        signedAt: Date | null;
        provider: string;
        message: string;
    }>;
    handleWebhook(payload: {
        document_id: string;
        signed_at: string;
    }, providedSecret?: string): Promise<{
        success: boolean;
    }>;
}
