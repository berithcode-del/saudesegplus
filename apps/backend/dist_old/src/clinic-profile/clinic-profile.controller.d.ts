import { PrismaService } from '../prisma.service';
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto';
export declare class ClinicProfileController {
    private prisma;
    constructor(prisma: PrismaService);
    listClinics(query: {
        state: string;
        city?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            city: string | null;
            state: string | null;
            isMatriz: boolean;
            parentClinicId: string | null;
        }[];
    }>;
    getProfile(req: any): Promise<{
        id: string;
        name: string;
        cnpj: string;
        address: string | null;
        city: string | null;
        state: string | null;
        phone: string | null;
        contactEmail: string | null;
        email: string | null;
        operatorName: string | null;
        operatorEmail: string | null;
    } | null>;
    updateProfile(req: any, body: UpdateClinicProfileDto): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    private getOwnClinicId;
    listOperators(req: any): Promise<{
        success: boolean;
        data: ({
            user: {
                id: string;
                createdAt: Date;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            name: string;
            clinicId: string;
            userId: string;
        })[];
    }>;
    createOperator(req: any, body: {
        name?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string | undefined;
            name: string | undefined;
            email: string;
            tempPassword: string;
        };
    }>;
    updateOperator(req: any, operatorId: string, body: {
        email?: string;
        password?: string;
    }): Promise<{
        success: boolean;
    }>;
    deleteOperator(req: any, operatorId: string): Promise<{
        success: boolean;
    }>;
}
