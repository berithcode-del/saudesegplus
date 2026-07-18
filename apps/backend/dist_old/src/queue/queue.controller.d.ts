import { QueueService } from './queue.service';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    getQueue(doctorId: string, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
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
    enqueue(body: {
        examRequestId: string;
    }): Promise<{
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
    accept(id: string, req: {
        user: {
            profileId?: string | null;
        };
    }): Promise<{
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
}
