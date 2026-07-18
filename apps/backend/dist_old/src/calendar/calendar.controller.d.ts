import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    list(ownerType: string, ownerId: string, startDate?: string, endDate?: string, req?: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            clinicId: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            companyId: string | null;
            doctorId: string | null;
            title: string;
            date: Date;
        }[];
    }>;
    create(body: any, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            clinicId: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            companyId: string | null;
            doctorId: string | null;
            title: string;
            date: Date;
        };
    }>;
    update(id: string, body: any, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            clinicId: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            companyId: string | null;
            doctorId: string | null;
            title: string;
            date: Date;
        };
    }>;
    remove(id: string, req: {
        user: {
            role: string;
            profileId?: string | null;
        };
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
