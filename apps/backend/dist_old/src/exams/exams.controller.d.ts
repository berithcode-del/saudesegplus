import { ExamsService } from './exams.service';
export declare class ExamsController {
    private readonly examsService;
    constructor(examsService: ExamsService);
    listTypes(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            category: string;
            requiresEquipment: boolean;
            canBeRemoteReview: boolean;
        }[];
    }>;
    getRequired(cboCode: string): Promise<{
        success: boolean;
        data: {
            requiredExams: string[];
            riskGrade: string;
            requiresInPerson: boolean;
        };
    }>;
    searchCbo(query: string): Promise<{
        success: boolean;
        data: {
            cboCode: string;
            functionName: string;
        }[];
    }>;
    create(body: {
        examRequestId: string;
        examType?: string;
        valueJson?: Record<string, any>;
        attachmentUrl?: string;
        operatorId?: string;
        results?: Array<{
            examType: string;
            valueJson: Record<string, any>;
            attachmentUrl?: string;
        }>;
    }, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: any[];
    }>;
    sendToQueue(examRequestId: string): Promise<{
        success: boolean;
    }>;
    createPatient(body: {
        name: string;
        cpf: string;
        phone?: string;
        functionCboCode?: string;
        examPurpose: string;
        clinicId?: string;
        inviteId?: string;
        paymentId: string;
    }): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
