import { AnamneseService } from './anamnese.service';
export declare class AnamneseController {
    private readonly anamneseService;
    constructor(anamneseService: AnamneseService);
    findByPatient(patientId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            patientId: string;
            queixas: string | null;
            historicoOcupacional: string | null;
            historicoMedico: string | null;
            medicamentos: string | null;
            habitos: string | null;
        } | null;
    }>;
    upsert(patientId: string, body: {
        queixas?: string;
        historicoOcupacional?: string;
        historicoMedico?: string;
        medicamentos?: string;
        habitos?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            patientId: string;
            queixas: string | null;
            historicoOcupacional: string | null;
            historicoMedico: string | null;
            medicamentos: string | null;
            habitos: string | null;
        };
    }>;
}
