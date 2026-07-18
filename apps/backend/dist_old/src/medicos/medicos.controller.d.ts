import { MedicosService } from './medicos.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
interface AuthenticatedRequest {
    user: {
        sub: string;
    };
}
export declare class MedicosController {
    private readonly medicosService;
    constructor(medicosService: MedicosService);
    list(search?: string, city?: string, state?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: import("../common/pagination").PaginatedResult<any>;
    }>;
    getProfile(doctorId: string): Promise<{
        success: boolean;
        data: {
            email: string;
            id: string;
            name: string;
            city: string | null;
            state: string | null;
            phone: string | null;
            contactEmail: string | null;
            status: string;
            gender: string | null;
            crmNumber: string;
            crmState: string;
            rqeNumber: string | null;
            specialties: string | null;
            verifiedAt: Date | null;
            user: {
                email: string;
            };
        };
    }>;
    listSolicitacoes(doctorId: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            queueStatus: string;
            enteredQueueAt: Date;
            assignedAt: Date | null;
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
            patient: {
                id: string;
                name: string;
                phone: string | null;
                status: string;
                createdAt: Date;
                userId: string;
                cpf: string;
                birthDate: Date | null;
                functionCboCode: string | null;
            };
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
            invite: ({
                company: {
                    id: string;
                    cnpj: string;
                    razaoSocial: string;
                    nomeFantasia: string | null;
                    name: string | null;
                    planType: string | null;
                    address: string | null;
                    cep: string | null;
                    city: string | null;
                    state: string | null;
                    phone: string | null;
                    contactEmail: string | null;
                    lat: number | null;
                    lng: number | null;
                    status: import(".prisma/client").$Enums.CompanyStatus;
                    clinicId: string | null;
                    pcmsoDocumentUrl: string | null;
                    ppraDocumentUrl: string | null;
                    pcmsoValidUntil: Date | null;
                    ppraValidUntil: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.InviteStatus;
                clinicId: string | null;
                createdAt: Date;
                examType: string;
                token: string;
                paymentId: string | null;
                companyId: string;
                expectedCpf: string | null;
                expectedEmail: string | null;
                roleFunction: string;
                roleFunctionCboCode: string | null;
                expiresAt: Date;
                sentAt: Date;
                openedAt: Date | null;
                collaboratorName: string | null;
                expectedBirthDate: Date | null;
            }) | null;
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
        }[];
    }>;
    updateProfile(req: AuthenticatedRequest, doctorId: string, body: UpdateDoctorProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            city: string | null;
            state: string | null;
            phone: string | null;
            contactEmail: string | null;
            status: string;
            userId: string;
            gender: string | null;
            crmNumber: string;
            crmState: string;
            signaturePin: string | null;
            rqeNumber: string | null;
            specialties: string | null;
            verifiedAt: Date | null;
            credentialSource: string | null;
        };
    }>;
    setSignaturePin(req: AuthenticatedRequest, body: {
        currentPassword: string;
        pin: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
