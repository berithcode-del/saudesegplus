import { SignatureService } from './signature.service';
interface AuthenticatedRequest {
    user: {
        sub: string;
    };
}
export declare class SignatureController {
    private readonly signatureService;
    constructor(signatureService: SignatureService);
    generateLink(req: AuthenticatedRequest, body: {
        examRequestId: string;
    }): Promise<{
        url: string;
        asoDocumentId: string;
        expiresAt: string;
        success: boolean;
    }>;
    signDocument(req: AuthenticatedRequest, id: string, body: {
        pin: string;
    }): Promise<{
        success: boolean;
        signedAt: Date | null;
        provider: string;
        message: string;
    }>;
    handleWebhook(payload: {
        document_id: string;
        signed_at: string;
    }, webhookSecret?: string): Promise<{
        success: boolean;
    }>;
}
export {};
