import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
interface ValidateInviteAndRegisterArgs {
    token: string;
    name: string;
    password: string;
}
export declare class ColaboradorService {
    private readonly prisma;
    private readonly companyGateway;
    constructor(prisma: PrismaService, companyGateway: CompanyGateway);
    validateInviteAndRegister(args: ValidateInviteAndRegisterArgs): Promise<{
        userId: string;
        email: string;
        name: string;
        patientId: string;
        companyId: string;
        examRequestId: string;
        examRequestStatus: string;
    }>;
    listSolicitacoes(patientId: string): Promise<({
        clinic: {
            id: string;
            cnpj: string;
            name: string;
            address: string | null;
            city: string | null;
            state: string | null;
            phone: string | null;
            contactEmail: string | null;
            lat: number | null;
            lng: number | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            credentialSource: string | null;
            isActive: boolean;
            isFranchise: boolean;
            isMatriz: boolean;
            parentClinicId: string | null;
        } | null;
        asoDocuments: {
            id: string;
            requestId: string;
            doctorId: string;
            decision: string;
            restrictionNotes: string | null;
            pdfUrl: string | null;
            signatureProviderId: string | null;
            signedAt: Date | null;
            validUntil: Date | null;
        }[];
        results: ({
            type: {
                id: string;
                name: string;
                category: string;
                requiresEquipment: boolean;
                canBeRemoteReview: boolean;
                validityDays: number;
            };
        } & {
            id: string;
            requestId: string;
            source: string;
            typeId: string;
            valueJson: string;
            attachmentUrl: string | null;
            collectedById: string;
            collectedAt: Date;
        })[];
    } & {
        id: string;
        status: string;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        inviteId: string | null;
        source: string;
        examPurpose: string;
        paymentId: string | null;
    })[]>;
}
export {};
