import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InviteStatus, Prisma, Role, StatusProtocolo, TipoExame } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { AsoProtocoloService } from '../aso-protocolo/aso-protocolo.service';

export interface ValidateInviteAndRegisterArgs {
  token: string;
  name: string;
  password: string;
}

@Injectable()
export class ColaboradorService {
  private readonly logger = new Logger(ColaboradorService.name);

  constructor(
    private prisma: PrismaService,
    private companyGateway: CompanyGateway,
    private asoProtocoloService: AsoProtocoloService,
  ) {}

  private mapExamTypeToTipoExame(examType: string): TipoExame {
    const map = {
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
    //    e NÃO pelo `id` interno do registro.
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
        name,
        cpf: invite.expectedCpf.replace(/\D/g, ''),
        birthDate: invite.expectedBirthDate ?? undefined,
        phone: '',
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

    // 5..10. Transação atômica: ExamRequest + ProcessoASO update + convite + timeline.
    // Se qualquer passo falhar, $transaction faz rollback de tudo.
    const result = await this.prisma.$transaction(
      async (tx) => {
        this.logger.log(
          `[validateInviteAndRegister] Transacao atomica: convite=${invite.id}, empresa=${invite.companyId}`,
        );

        // 5. Criar ExamRequest
        const examRequest = await tx.examRequest.create({
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

        // 6. Resolver clinicaId com fallback
        const clinicaId =
          invite.company.clinicId ?? examRequest.clinicId ?? null;

        if (!clinicaId) {
          const fallbackClinic = await tx.clinic.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });
          if (fallbackClinic) {
            this.logger.warn(
              `[validateInviteAndRegister] clinicaId vazio para invite=${invite.id}, usando fallback ${fallbackClinic.id}`,
            );
          } else {
            this.logger.error(
              '[validateInviteAndRegister] Nenhuma clinica ativa - ProcessoASO sera criado sem clinica',
            );
          }
        }

        // 7. ATUALIZAR ProcessoASO existente (criado no pagamento) — não criar novo
        // Buscar protocolo pelo inviteId
        const protocoloExistente = await tx.processoASO.findUnique({
          where: { inviteId: invite.id },
        });

        if (!protocoloExistente) {
          throw new BadRequestException(
            `Protocolo não encontrado para convite ${invite.id}. O pagamento deveria ter gerado o ProcessoASO.`,
          );
        }

        const protocolo = await this.asoProtocoloService.update(
          protocoloExistente.id,
          {
            status: StatusProtocolo.EM_PROGRESSO,
            pacienteId: patient.id,
            clinicaId: clinicaId ?? undefined,
            tipoExame: this.mapExamTypeToTipoExame(invite.examType),
          },
          user.id,
        );

        // 8. Vincular protocolo ao ExamRequest
        await tx.examRequest.update({
          where: { id: examRequest.id },
          data: { processoAsoId: protocolo.id },
        });

        // 9. Marcar convite como CONCLUIDO
        await tx.examInvite.update({
          where: { id: invite.id },
          data: {
            status: InviteStatus.CONCLUIDO,
            openedAt: invite.openedAt ?? new Date(),
          },
        });

        // 10. Registrar CADASTRO_CONCLUIDO na timeline
        const timelineEvent = await tx.examTimelineEvent.create({
          data: {
            inviteId: invite.id,
            examRequestId: examRequest.id,
            eventType: 'CADASTRO_CONCLUIDO',
          },
        });

        this.logger.log(
          `[validateInviteAndRegister] Protocolo atualizado: ${protocolo.numeroProtocolo} (${protocolo.id}) -> EM_PROGRESSO, pacienteId=${patient.id}`,
        );

        return { examRequest, protocolo, timelineEvent };
      },
      {
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    const { examRequest, protocolo, timelineEvent } = result;

    // 11. Notificar painel da empresa via WebSocket
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
        processoAso: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}