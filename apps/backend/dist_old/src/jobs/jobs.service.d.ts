import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { MailService } from '../mail/mail.service';
export declare class JobsService {
    private readonly prisma;
    private readonly companyGateway;
    private readonly mailService;
    private readonly logger;
    constructor(prisma: PrismaService, companyGateway: CompanyGateway, mailService: MailService);
    expirarConvitesVencidos(): Promise<void>;
    verificarDocumentosVencidos(): Promise<void>;
    avisarAsosProximosDoVencimento(): Promise<void>;
}
