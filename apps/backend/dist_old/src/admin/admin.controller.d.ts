import { AdminService } from './admin.service';
import { UpdateAdminClinicDto, UpdateAdminCompanyDto, UpdateAdminDoctorDto, SetMatrizClinicDto } from './dto/update-admin-profiles.dto';
import { CompanyStatus } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getCompanies(status?: CompanyStatus): Promise<({
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
        admins: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            companyId: string;
        })[];
    } & {
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
    })[]>;
    getCompaniesPendingApproval(): Promise<({
        admins: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            companyId: string;
        })[];
        documents: {
            id: string;
            type: string;
            companyId: string;
            fileUrl: string;
            validUntil: Date | null;
            originalName: string;
            uploadedAt: Date;
        }[];
    } & {
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
    })[]>;
    getCompany(id: string): Promise<{
        accessEmail: string;
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
        admins: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            companyId: string;
        })[];
        documents: {
            id: string;
            type: string;
            companyId: string;
            fileUrl: string;
            validUntil: Date | null;
            originalName: string;
            uploadedAt: Date;
        }[];
        patients: ({
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
        } & {
            id: string;
            patientId: string;
            companyId: string;
            endDate: Date | null;
            startDate: Date;
        })[];
        examInvites: {
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
        }[];
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
    }>;
    updateCompany(id: string, body: UpdateAdminCompanyDto): Promise<{
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
    }>;
    deleteCompany(id: string): Promise<{
        success: boolean;
    }>;
    getClinics(): Promise<({
        companies: {
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
        }[];
        operators: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            name: string;
            clinicId: string;
            userId: string;
        })[];
    } & {
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
    })[]>;
    getClinic(id: string): Promise<{
        accessEmail: string | null;
        user: {
            id: string;
            email: string;
        } | null;
        companies: {
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
        }[];
        examRequests: {
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
        operators: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            name: string;
            clinicId: string;
            userId: string;
        })[];
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
    }>;
    createClinic(body: any): Promise<{
        email: string;
        tempPassword: string;
        id?: string | undefined;
        cnpj?: string | undefined;
        name?: string | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        state?: string | null | undefined;
        phone?: string | null | undefined;
        contactEmail?: string | null | undefined;
        lat?: number | null | undefined;
        lng?: number | null | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        userId?: string | null | undefined;
        credentialSource?: string | null | undefined;
        isActive?: boolean | undefined;
        isFranchise?: boolean | undefined;
        isMatriz?: boolean | undefined;
        parentClinicId?: string | null | undefined;
    }>;
    updateClinic(id: string, body: UpdateAdminClinicDto): Promise<{
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
    }>;
    deleteClinic(id: string): Promise<{
        success: boolean;
    }>;
    setClinicAsMatriz(id: string, body: SetMatrizClinicDto): Promise<{
        companies: {
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
        }[];
        operators: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            name: string;
            clinicId: string;
            userId: string;
        })[];
    } & {
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
    }>;
    getDoctors(): Promise<({
        user: {
            email: string;
        };
    } & {
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
    })[]>;
    getDoctor(id: string): Promise<{
        accessEmail: string;
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
        user: {
            createdAt: Date;
            email: string;
        };
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
    }>;
    createDoctor(body: {
        name: string;
        gender?: string;
        crmNumber: string;
        crmState: string;
        city?: string;
        state?: string;
        specialties?: string;
        email?: string;
    }): Promise<{
        email: string;
        tempPassword: string;
        id?: string | undefined;
        name?: string | undefined;
        city?: string | null | undefined;
        state?: string | null | undefined;
        phone?: string | null | undefined;
        contactEmail?: string | null | undefined;
        status?: string | undefined;
        userId?: string | undefined;
        gender?: string | null | undefined;
        crmNumber?: string | undefined;
        crmState?: string | undefined;
        signaturePin?: string | null | undefined;
        rqeNumber?: string | null | undefined;
        specialties?: string | null | undefined;
        verifiedAt?: Date | null | undefined;
        credentialSource?: string | null | undefined;
    }>;
    updateDoctor(id: string, body: UpdateAdminDoctorDto): Promise<{
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
    }>;
    verifyDoctor(id: string): Promise<{
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
    }>;
    deleteDoctor(id: string): Promise<{
        success: boolean;
    }>;
    getStats(): Promise<{
        totalCompanies: number;
        totalPatients: number;
        totalSolicitacoes: number;
        totalAsoEmitidos: number;
        financial: {
            receita: number;
            repasses: number;
            pendente: number;
            lucro: number;
        };
    }>;
    approveCompanyDocumentation(companyId: string, body: {
        approvedBy: string;
    }): Promise<{
        success: boolean;
        message: string;
        companyId: string;
        approvedAt: Date;
        approvedBy: string;
    }>;
}
