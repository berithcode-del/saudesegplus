import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { PresenceService } from '../presence/presence.service';
export declare class QueueService {
    private prisma;
    private companyGateway;
    private presenceService;
    constructor(prisma: PrismaService, companyGateway: CompanyGateway, presenceService: PresenceService);
    private calcGeoPriority;
    getQueueForDoctor(doctorId: string): Promise<{
        isOnline: boolean;
        priorityScore: number;
        request: {
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
        };
        id: string;
        city: string | null;
        state: string | null;
        status: string;
        requestId: string;
        enteredQueueAt: Date;
        region: string | null;
        assignedDoctorId: string | null;
        assignedAt: Date | null;
    }[]>;
    enqueue(examRequestId: string): Promise<{
        id: string;
        city: string | null;
        state: string | null;
        status: string;
        requestId: string;
        enteredQueueAt: Date;
        priorityScore: number;
        region: string | null;
        assignedDoctorId: string | null;
        assignedAt: Date | null;
    }>;
    acceptPatient(queueEntryId: string, doctorId: string): Promise<{
        id: string;
        city: string | null;
        state: string | null;
        status: string;
        requestId: string;
        enteredQueueAt: Date;
        priorityScore: number;
        region: string | null;
        assignedDoctorId: string | null;
        assignedAt: Date | null;
    }>;
    private recordTimelineEvent;
}
