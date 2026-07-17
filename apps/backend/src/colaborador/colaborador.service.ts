import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InviteStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { AsoProtoceloService } from '../aso-protocelo/aso-protocelo.service';
import { TipoExame } from '@prisma/client';

interface ValidateInviteAndRegisterArgs {
  token: string;
  name: string;
  password: string;
}

@Injectable()
export class ColaboradorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyGateway: CompanyGateway,
    private readonly asoProtoceloService: AsoProtoceloService,
  ) {}

  private mapExamTypeToTipoExame(examType: string): TipoExame {
    const map: Record<string, TipoExame> = {
      admissional: TipoExame.ADMISSIONAL,
      periodico: TipoExame.PERIODICO,
      demissional: TipoExame.DEMISSIONAL,
      mudanca_funcao: TipoExame.MUDANCA_FUNCAO,
      retorno_trabalho: TipoExame.RETORNO_TRABALHO,
    };
    return map[examType.toLowerCase()] ?? TipoExame.ADMISSIONAL;
  }

  async validateInviteAndRegister(args: ValidateInviteAndRegisterArgs) {
    const { token, name, password } = args;

    // 1. Buscar convite pelo campo `token` (link enviado ao colaborador),
    //    e NÃO pelo `id` interno do registro — eram tratados como
    //    sinônimos, mas são colunas diferentes no schema (bug corrigido).
    const invite = await this.prisma.examInvite.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (
      invite.status !== InviteStatus.ENVIADO &&
      invite.status !== InviteStatus.ABERTO
    ) {
      throw new BadRequestException('Convite já utilizado ou expirado');
    }

    if (invite.expiresAt < new Date()) {
      // Mantemos o status real do convite sincronizado com a regra de
      // negócio: convite vencido fica EXPIRADO (não é reenviado
      // automaticamente — a empresa precisa gerar um novo).
      await this.prisma.examInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRADO },
      });
      throw new BadRequestException('Convite expirado');
    }

    if (!invite.expectedEmail) {
      throw new BadRequestException('E-mail do convite não fornecido');
    }
    if (!invite.expectedCpf) {
      throw new BadRequestException('CPF do convite não fornecido');
    }

    const existingUser = await this.prisma.userAccount.findUnique({
      where: { email: invite.expectedEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Já existe um cadastro com este e-mail');
    }

    // 2. Criar UserAccount para o colaborador
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.userAccount.create({
      data: {
        email: invite.expectedEmail,
        passwordHash,
        role: Role.PATIENT,
      },
    });

    // 3. Criar registro Patient (colaborador)
    const patient = await this.prisma.patient.create({
      data: {
        userId: user.id,
        cpf: invite.expectedCpf.replace(/\D/g, ''),
        name,
        birthDate: invite.expectedBirthDate ?? undefined,
        phone: '', // Placeholder (Fase 3: coleta real)
        functionCboCode:
          invite.roleFunctionCboCode || invite.roleFunction || '0000-00',
      },
    });

    // 4. Vincular colaborador à empresa
    await this.prisma.companyPatientRelation.create({
      data: {
        companyId: invite.companyId,
        patientId: patient.id,
      },
    });

    // 5. Criar a Solicitação (ExamRequest) — esta etapa estava ausente e
    //    quebrava o fluxo ponta a ponta: sem ExamRequest, não havia nada
    //    para o médico atender nem para empresa/colaborador acompanhar.
    const examRequest = await this.prisma.examRequest.create({
      data: {
        patientId: patient.id,
        clinicId: invite.company.clinicId ?? undefined,
        inviteId: invite.id,
        source: 'convite_empresa',
        examPurpose: invite.examType,
        status: 'AGUARDANDO_COLETA',
        paymentId: invite.paymentId ?? undefined,
      },
    });

    // 6. Criar Protocolo ASO automaticamente
        const protocolo = await this.asoProtoceloService.create(
          {
            empresaId: invite.companyId,
            clinicaId: invite.company.clinicId ?? examRequest.clinicId ?? '',
            pacienteId: patient.id,
            tipoExame: this.mapExamTypeToTipoExame(invite.examType),
          },
          user.id,
        );

    // 7. Vincular protocolo ao ExamRequest
    await this.prisma.examRequest.update({
      where: { id: examRequest.id },
      data: { processoAsoId: protocolo.id },
    });

    // 8. Atualizar status do convite
    await this.prisma.examInvite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.CONCLUIDO,
        openedAt: invite.openedAt ?? new Date(),
      },
    });

    // 9. Registrar evento na timeline (CADASTRO_CONCLUIDO — mesma
    //    convenção usada pelo gerador de mock-data)
    const timelineEvent = await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: invite.id,
        examRequestId: examRequest.id,
        eventType: 'CADASTRO_CONCLUIDO',
      },
    });

    // 10. Notificar o painel da empresa em tempo real via WebSocket.
    //     Antes, este service não emitia nada — a empresa só veria a
    //     atualização após um refresh manual.
    this.companyGateway.emitTimelineUpdate(invite.companyId, {
      inviteId: invite.id,
      eventType: 'CADASTRO_CONCLUIDO',
      occurredAt: timelineEvent.occurredAt.toISOString(),
    });
    this.companyGateway.emitInviteStatusChange(invite.companyId, {
      inviteId: invite.id,
      status: InviteStatus.CONCLUIDO,
      examStatus: examRequest.status,
    });

    return {
      userId: user.id,
      email: user.email,
      name: patient.name,
      patientId: patient.id,
      companyId: invite.companyId,
      examRequestId: examRequest.id,
      examRequestStatus: examRequest.status,
      protocoloId: protocolo.id,
      numeroProtocolo: protocolo.numeroProtocolo,
    };
  }

  /** Lista as solicitações (ExamRequest) de um colaborador específico. */
  async listSolicitacoes(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    return this.prisma.examRequest.findMany({
      where: { patientId },
      include: {
        clinic: true,
        results: { include: { type: true } },
        asoDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
