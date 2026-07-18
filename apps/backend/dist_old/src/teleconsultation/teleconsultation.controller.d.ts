import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
export declare class TeleconsultationController {
    private readonly prisma;
    private readonly queueGateway;
    constructor(prisma: PrismaService, queueGateway: QueueGateway);
    createRoom(req: Request, body: {
        examRequestId: string;
        doctorId?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            requestId: string;
            doctorId: string;
            startedAt: Date;
            endedAt: Date | null;
            videoSessionId: string | null;
            recordingUrl: string | null;
            clinicalNotes: string | null;
            hostRoomUrl: string | null;
        };
    }>;
    private emitTeleconsultationStarted;
    private withEmbeddedJitsiConfig;
}
