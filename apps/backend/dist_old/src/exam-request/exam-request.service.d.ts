import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { PaginatedResult } from '../common/pagination';
import { PresenceService } from '../presence/presence.service';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
export declare class ExamRequestService {
    private readonly prisma;
    private readonly companyGateway;
    private readonly presenceService;
    private readonly storage;
    constructor(prisma: PrismaService, companyGateway: CompanyGateway, presenceService: PresenceService, storage: SupabaseStorageService);
    private parseResultValue;
    list(filters: {
        status?: string;
        companyId?: string;
        patientId?: string;
    }, page?: number, limit?: number, user?: {
        role: string;
        profileId?: string | null;
    }): Promise<PaginatedResult<any>>;
    findOne(id: string, user?: {
        role: string;
        profileId?: string | null;
    }): Promise<{
        results: {
            valueJson: any;
            type: {
                id: string;
                name: string;
                category: string;
                requiresEquipment: boolean;
                canBeRemoteReview: boolean;
                validityDays: number;
            };
            id: string;
            requestId: string;
            source: string;
            typeId: string;
            attachmentUrl: string | null;
            collectedById: string;
            collectedAt: Date;
        }[];
        presence: {
            patientOnline: boolean;
        };
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
            anamneses: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                patientId: string;
                queixas: string | null;
                historicoOcupacional: string | null;
                historicoMedico: string | null;
                medicamentos: string | null;
                habitos: string | null;
            }[];
        } & {
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
        teleconsultations: {
            id: string;
            requestId: string;
            doctorId: string;
            startedAt: Date;
            endedAt: Date | null;
            videoSessionId: string | null;
            recordingUrl: string | null;
            clinicalNotes: string | null;
            hostRoomUrl: string | null;
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
    }>;
    assertAccess(id: string, user: {
        role: string;
        profileId?: string | null;
    }, write?: boolean): Promise<void>;
    getResultAttachment(resultId: string, user: {
        role: string;
        profileId?: string | null;
    }): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
    }>;
    updateStatus(id: string, body: {
        status: string;
        laudoTexto?: string;
        decision?: string;
        restrictionNotes?: string;
        doctorId?: string;
    }): Promise<{
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
    }>;
}
