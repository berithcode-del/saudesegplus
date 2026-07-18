import { PrismaService } from './prisma.service';
export declare class AppController {
    private prisma;
    constructor(prisma: PrismaService);
    health(): {
        status: string;
        timestamp: string;
    };
    getDoctors(): Promise<({
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    getClinics(): Promise<{
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
    }[]>;
}
