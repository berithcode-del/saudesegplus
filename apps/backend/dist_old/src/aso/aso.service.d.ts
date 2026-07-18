import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { FinancialService } from '../financial/financial.service';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
export declare class AsoService {
    private readonly prisma;
    private readonly mailService;
    private readonly financialService;
    private readonly storage;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService, financialService: FinancialService, storage: SupabaseStorageService);
    private getPuppeteer;
    private getChromium;
    private shortId;
    private logAsoStep;
    private logAsoError;
    private escapeHtml;
    private resolveTemplatePath;
    private formatExamPurpose;
    private formatBirthDate;
    generatePdf(examRequestId: string, userId: string, decision: string, restrictionNotes?: string): Promise<{
        pdfUrl: string;
        asoDocumentId: string;
    }>;
    private generatePdfInternal;
}
