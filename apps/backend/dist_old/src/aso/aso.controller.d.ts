import { AsoService } from './aso.service';
interface AuthenticatedRequest {
    user: {
        sub: string;
    };
}
export declare class AsoController {
    private readonly asoService;
    constructor(asoService: AsoService);
    generatePdf(req: AuthenticatedRequest, body: {
        examRequestId: string;
        decision: string;
        restrictionNotes?: string;
    }): Promise<{
        success: boolean;
        pdfUrl: string;
        asoDocumentId: string;
    }>;
}
export {};
