import type { Request } from 'express';
import type { Response } from 'express';
import { PortalService } from './portal.service';
import { AuthPortalDto } from './dto/auth-portal.dto';
import { ConfirmarDadosDto } from './dto/confirmar-dados.dto';
import { QuestionarioDto } from './dto/questionario.dto';
import { EnviarDocumentoDto } from './dto/enviar-documento.dto';
import { PresenceService } from '../presence/presence.service';
export declare class PortalController {
    private readonly portalService;
    private readonly presenceService;
    constructor(portalService: PortalService, presenceService: PresenceService);
    heartbeat(req: Request): Promise<{
        success: boolean;
    }>;
    preview(token: string): Promise<{
        expirado: boolean;
        empresaNome: null;
        tipoExame: null;
    } | {
        expirado: boolean;
        empresaNome: string;
        tipoExame: string;
    }>;
    auth(dto: AuthPortalDto): Promise<{
        sessionToken: string;
        processId: any;
        patientName: string;
        companyName: string;
        examPurpose: string;
    }>;
    getProcesso(req: Request): Promise<{
        id: string;
        status: string;
        proximaAcao: {
            tipo: string;
            titulo: string;
            descricao: string;
            cta: string;
            ctaUrl: string;
            endereco: string | null;
        } | {
            tipo: string;
            titulo: string;
            descricao: string;
            cta: null;
            ctaUrl: null;
            endereco: null;
        };
        empresa: {
            nome: string;
        };
        paciente: {
            nome: string;
            cpf: string;
            birthDate: Date | null;
            phone: string | null;
            email: null;
        };
        documentos: {
            tipo: string;
            enviado: boolean;
            fileUrl: string | null;
        }[];
        questionario: {
            respondido: boolean;
        };
        teleconsulta: {
            disponivel: boolean;
            linkSala: string | null;
        };
        aso: {
            disponivel: boolean;
            pdfUrl: string | null;
            decision: string;
            validUntil: Date | null;
        };
        timeline: {
            eventType: import(".prisma/client").$Enums.TimelineEventType;
            occurredAt: Date;
            metadata: any;
        }[];
        examesSolicitados: string[];
        progresso: {
            ativo: boolean;
            label: string;
            concluido: boolean;
        }[];
    }>;
    confirmarDados(req: Request, dto: ConfirmarDadosDto): Promise<{
        success: boolean;
    }>;
    getStatusDocumentos(req: Request): Promise<{
        tipo: string;
        enviado: boolean;
        fileUrl: string | null;
    }[]>;
    enviarDocumento(req: Request, dto: EnviarDocumentoDto): Promise<{
        success: boolean;
    }>;
    responderQuestionario(req: Request, dto: QuestionarioDto): Promise<{
        success: boolean;
        status: string;
    }>;
    getAso(req: Request, response: Response): Promise<void>;
}
