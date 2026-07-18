import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendInviteLink(to: string, empresa: string, link: string, expiresAt: Date): Promise<void>;
    sendAsoReady(to: string, patientName: string, pdfUrl: string): Promise<void>;
    sendAsoExpirationAlert(to: string, empresa: string, asos: Array<{
        patientName: string;
        examType: string;
        validUntil: Date;
        daysUntilExpiration: number;
    }>): Promise<void>;
}
