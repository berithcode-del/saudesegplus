import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { QuestionarioDto } from './dto/questionario.dto';
import { QueueService } from '../queue/queue.service';
import { CompanyGateway } from '../company/company.gateway';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
export declare class PortalService {
    private readonly prisma;
    private readonly jwtService;
    private readonly queueService;
    private readonly companyGateway;
    private readonly storage;
    constructor(prisma: PrismaService, jwtService: JwtService, queueService: QueueService, companyGateway: CompanyGateway, storage: SupabaseStorageService);
    auth(token: string, cpf: string, birthDate: string): Promise<{
        sessionToken: string;
        processId: any;
        patientName: string;
        companyName: string;
        examPurpose: string;
    }>;
    private normalizeBirthDate;
    private birthDatesMatch;
    private birthDateCandidates;
    private formatDateParts;
    getProcesso(patientId: string, processId: string): Promise<{
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
    private calcularProximaAcao;
    private verificarDocumentosObrigatorios;
    private calcularProgresso;
    confirmarDados(processId: string, patientId: string, phone?: string, email?: string): Promise<{
        success: boolean;
    }>;
    getStatusDocumentos(patientId: string, processId: string): Promise<{
        tipo: string;
        enviado: boolean;
        fileUrl: string | null;
    }[]>;
    enviarDocumento(processId: string, patientId: string, tipo: string, fileUrl: string): Promise<{
        success: boolean;
    }>;
    responderQuestionario(processId: string, patientId: string, data: QuestionarioDto): Promise<{
        success: boolean;
        status: string;
    }>;
    getAso(processId: string, patientId: string): Promise<{
        pdfUrl: string | null;
        decision: string;
        validUntil: Date | null;
    }>;
    getAsoFile(processId: string, patientId: string): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
    }>;
    private findBestClinicForInvite;
    private distanceKm;
    private withEmbeddedJitsiConfig;
    preview(token: string): Promise<{
        expirado: boolean;
        empresaNome: null;
        tipoExame: null;
    } | {
        expirado: boolean;
        empresaNome: string;
        tipoExame: string;
    }>;
}
