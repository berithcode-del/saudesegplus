import { PrismaService } from '../prisma.service';
export declare class AnamneseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByPatient(patientId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        queixas: string | null;
        historicoOcupacional: string | null;
        historicoMedico: string | null;
        medicamentos: string | null;
        habitos: string | null;
    } | null>;
    upsert(patientId: string, data: {
        queixas?: string;
        historicoOcupacional?: string;
        historicoMedico?: string;
        medicamentos?: string;
        habitos?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        queixas: string | null;
        historicoOcupacional: string | null;
        historicoMedico: string | null;
        medicamentos: string | null;
        habitos: string | null;
    }>;
}
