import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { QueueService } from '../queue/queue.service';
export declare class ExamsService {
    private readonly prisma;
    private readonly companyGateway;
    private readonly queueService;
    constructor(prisma: PrismaService, companyGateway: CompanyGateway, queueService: QueueService);
    createExam(examRequestId: string, examType: string, valueJson: Record<string, any>, attachmentUrl?: string, actor?: {
        role: string;
        profileId?: string | null;
    }, selectedOperatorId?: string): Promise<any>;
    sendToMedicalQueue(examRequestId: string): Promise<{
        success: boolean;
    }>;
    findTypes(): Promise<{
        id: string;
        name: string;
        category: string;
        requiresEquipment: boolean;
        canBeRemoteReview: boolean;
    }[]>;
    findRequiredByCbo(cboCode: string): Promise<{
        requiredExams: string[];
        riskGrade: string;
        requiresInPerson: boolean;
    }>;
    searchByFunctionName(query: string): Promise<{
        cboCode: string;
        functionName: string;
    }[]>;
    resolveOperatorForCollection(clinicId: string | null | undefined, actor?: {
        role: string;
        profileId?: string | null;
    }, selectedOperatorId?: string): Promise<{
        id: string;
        name: string;
        clinicId: string;
        userId: string;
    }>;
    createPatient(data: {
        name: string;
        cpf: string;
        phone?: string;
        functionCboCode?: string;
        examPurpose: string;
        clinicId?: string;
        inviteId?: string;
        paymentId: string;
    }): Promise<{
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
        examRequest: {
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
        };
        existing: boolean;
    } | {
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
        examRequest: {
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
        };
        existing?: undefined;
    }>;
}
