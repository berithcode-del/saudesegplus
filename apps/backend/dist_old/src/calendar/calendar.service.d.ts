import { PrismaService } from '../prisma.service';
export declare class CalendarService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertOwnerAccess(ownerType: string, ownerId: string, user: {
        role: string;
        profileId?: string | null;
    }): Promise<void>;
    assertEventAccess(id: string, user: {
        role: string;
        profileId?: string | null;
    }): Promise<void>;
    listEvents(ownerType: string, ownerId: string, startDate?: string, endDate?: string): Promise<{
        id: string;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        companyId: string | null;
        doctorId: string | null;
        title: string;
        date: Date;
    }[]>;
    createEvent(data: any): Promise<{
        id: string;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        companyId: string | null;
        doctorId: string | null;
        title: string;
        date: Date;
    }>;
    updateEvent(id: string, data: any): Promise<{
        id: string;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        companyId: string | null;
        doctorId: string | null;
        title: string;
        date: Date;
    }>;
    deleteEvent(id: string): Promise<{
        id: string;
        clinicId: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        companyId: string | null;
        doctorId: string | null;
        title: string;
        date: Date;
    }>;
}
