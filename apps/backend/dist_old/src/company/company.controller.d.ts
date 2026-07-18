import type { Response } from 'express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
export declare class CompanyController {
    private readonly companyService;
    constructor(companyService: CompanyService);
    createCompany(dto: CreateCompanyDto): Promise<{
        success: boolean;
        data: {
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
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        };
    }>;
    listCompanies(): Promise<{
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
        })[];
    }>;
    listAllInvites(): Promise<{
        success: boolean;
        data: ({
            examRequest: ({
                results: {
                    id: string;
                    requestId: string;
                    source: string;
                    typeId: string;
                    valueJson: string;
                    attachmentUrl: string | null;
                    collectedById: string;
                    collectedAt: Date;
                }[];
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
            }) | null;
            timelineEvents: {
                id: string;
                inviteId: string | null;
                eventType: import(".prisma/client").$Enums.TimelineEventType;
                occurredAt: Date;
                metadata: string | null;
                examRequestId: string | null;
            }[];
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
        })[];
    }>;
    statusCheck(id: string): Promise<{
        success: boolean;
        data: {
            hasRazaoSocial: boolean;
            hasPcmso: boolean;
            hasPpra: boolean;
            pcmsoValid: boolean;
            ppraValid: boolean;
            hasClinicAssigned: boolean;
            clinic: {
                id: string;
                name: string;
                address: string | null;
                city: string | null;
                state: string | null;
            } | null;
            status: import(".prisma/client").$Enums.CompanyStatus;
            isComplete: boolean;
        };
    }>;
    getInviteTimeline(inviteId: string): Promise<{
        success: boolean;
        data: {
            invite: {
                examRequest: ({
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
                }) | null;
                timelineEvents: {
                    id: string;
                    inviteId: string | null;
                    eventType: import(".prisma/client").$Enums.TimelineEventType;
                    occurredAt: Date;
                    metadata: string | null;
                    examRequestId: string | null;
                }[];
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
            };
            timeline: {
                id: string;
                inviteId: string | null;
                eventType: import(".prisma/client").$Enums.TimelineEventType;
                occurredAt: Date;
                metadata: string | null;
                examRequestId: string | null;
            }[];
            finalResult: string | null;
        };
    }>;
    searchInvite(cpf: string, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
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
        };
        message?: undefined;
    }>;
    getCompany(id: string): Promise<{
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
            admins: {
                id: string;
                createdAt: Date;
                userId: string;
                companyId: string;
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
        }) | null;
    }>;
    updateCompany(id: string, dto: UpdateCompanyDto): Promise<{
        success: boolean;
        data: {
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
    }>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
        success: boolean;
        data: {
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
    }>;
    getDashboard(id: string): Promise<{
        success: boolean;
        data: {
            total: number;
            sent: number;
            opened: number;
            inProgress: number;
            completed: number;
            expired: number;
        };
    }>;
    createInvite(companyId: string, dto: CreateInviteDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    cancelInvite(id: string): Promise<{
        success: boolean;
    }>;
    listInvites(companyId: string): Promise<{
        success: boolean;
        data: ({
            examRequest: ({
                results: {
                    id: string;
                    requestId: string;
                    source: string;
                    typeId: string;
                    valueJson: string;
                    attachmentUrl: string | null;
                    collectedById: string;
                    collectedAt: Date;
                }[];
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
            }) | null;
            timelineEvents: {
                id: string;
                inviteId: string | null;
                eventType: import(".prisma/client").$Enums.TimelineEventType;
                occurredAt: Date;
                metadata: string | null;
                examRequestId: string | null;
            }[];
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
        })[];
    }>;
    listActiveAsos(companyId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            requestId: string;
            collaborator: {
                id: string;
                name: string;
                cpf: string;
                functionCboCode: string | null;
            };
            examType: string;
            examPurpose: string;
            issuedAt: string;
            validUntil: string;
            daysUntilExpiration: number;
            decision: string;
            restrictionNotes: string | null;
            pdfUrl: string | null;
            doctor: {
                id: string;
                name: string;
                crm: string;
            };
        }[];
    }>;
    relatorio(id: string, res: Response, de?: string, ate?: string): Promise<void>;
    getAsoFile(companyId: string, asoId: string, response: Response): Promise<void>;
}
