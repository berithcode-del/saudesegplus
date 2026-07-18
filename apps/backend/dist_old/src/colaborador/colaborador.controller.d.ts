import { ColaboradorService } from './colaborador.service';
import { ValidateInviteDto } from './dto/validate-invite.dto';
export declare class ColaboradorController {
    private readonly colaboradorService;
    constructor(colaboradorService: ColaboradorService);
    validateInviteAndRegister(dto: ValidateInviteDto): Promise<{
        success: boolean;
        data: {
            userId: string;
            email: string;
            name: string;
            patientId: string;
            companyId: string;
            examRequestId: string;
            examRequestStatus: string;
        };
    }>;
    listSolicitacoes(patientId: string): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
}
