import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InviteStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { QuestionarioDto } from './dto/questionario.dto';
import { QueueService } from '../queue/queue.service';
import { CompanyGateway } from '../company/company.gateway';
@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly queueService: QueueService,
    private readonly companyGateway: CompanyGateway,
  ) {}

  async auth(token: string, cpf: string, birthDate: string) {
    const invite = await this.prisma.examInvite.findUnique({
      where: { token },
      include: {
        company: true,
        examRequest: { include: { patient: true } },
      },
    });

    if (!invite || invite.status === 'EXPIRADO') {
      throw new UnauthorizedException('Convite inválido ou expirado');
    }

    const normalizeCpf = (v: string) => v.replace(/\D/g, '');
    if (normalizeCpf(invite.expectedCpf ?? '') !== normalizeCpf(cpf)) {
      throw new UnauthorizedException('Dados não conferem ou link expirado.');
    }

    if (invite.expectedBirthDate) {
      const storedDateStr = invite.expectedBirthDate.toISOString().slice(0, 10);
      if (storedDateStr !== birthDate) {
        throw new UnauthorizedException('Dados não conferem ou link expirado.');
      }
    }

    let patient = await this.prisma.patient.findUnique({
      where: { cpf: normalizeCpf(invite.expectedCpf ?? cpf) },
    });
    let examRequest: any = invite.examRequest ?? null;

    if (!patient) {
      // Garantir e-mail único para não dar erro se o RH usar o mesmo e-mail para todos
      let uniqueEmail = invite.expectedEmail || `paciente-${invite.token}@temp.saudeseg.com`;
      const emailExists = await this.prisma.userAccount.findUnique({ where: { email: uniqueEmail } });
      if (emailExists) {
        uniqueEmail = `paciente-${invite.token}@temp.saudeseg.com`;
      }

      const userAccount = await this.prisma.userAccount.create({
        data: {
          email: uniqueEmail,
          passwordHash: await bcrypt.hash(cpf, 10),
          role: Role.PATIENT,
        },
      });

      patient = await this.prisma.patient.create({
        data: {
          userId: userAccount.id,
          cpf: normalizeCpf(invite.expectedCpf ?? cpf),
          name: invite.collaboratorName ?? 'Paciente',
          birthDate: invite.expectedBirthDate ?? new Date(birthDate),
          phone: '',
          functionCboCode: invite.roleFunctionCboCode || invite.roleFunction || '0000-00',
        },
      });

      await this.prisma.companyPatientRelation.create({
        data: {
          companyId: invite.companyId,
          patientId: patient.id,
        },
      });
    } else {
      // Paciente já existe, verificar se já tem vínculo com a empresa
      const relation = await this.prisma.companyPatientRelation.findFirst({
        where: { companyId: invite.companyId, patientId: patient.id },
      });
      if (!relation) {
        await this.prisma.companyPatientRelation.create({
          data: { companyId: invite.companyId, patientId: patient.id },
        });
      }
    }

    if (!examRequest) {
      // Se a empresa não tem clínica atribuída, pega a primeira ativa disponível
      let resolvedClinicId = invite.company.clinicId ?? null;
      if (!resolvedClinicId) {
        const fallbackClinic = await this.prisma.clinic.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
        resolvedClinicId = fallbackClinic?.id ?? null;
      }

      examRequest = await this.prisma.examRequest.create({
        data: {
          patientId: patient.id,
          clinicId: resolvedClinicId ?? undefined,
          inviteId: invite.id,
          source: 'convite_empresa',
          examPurpose: invite.examType,
          status: 'AGUARDANDO_COLETA',
        },
      });

      await this.prisma.examInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ABERTO, openedAt: new Date() },
      });

      this.companyGateway.emitTimelineUpdate(invite.companyId, {
        inviteId: invite.id,
        eventType: 'CADASTRO_CONCLUIDO',
        occurredAt: new Date().toISOString(),
      });
      this.companyGateway.emitInviteStatusChange(invite.companyId, {
        inviteId: invite.id,
        status: InviteStatus.ABERTO,
        examStatus: examRequest.status,
      });
    }

    if (!examRequest) {
      throw new NotFoundException('Solicitação de exames não encontrada');
    }

    const sessionToken = this.jwtService.sign(
      { sub: patient.id, processId: examRequest.id, role: 'PORTAL' },
      { secret: process.env.JWT_SECRET ?? 'saudeseg_secret_key_2026', expiresIn: '4h' },
    );

    // Apenas garante que não foi expirado
    if (invite.status === 'ENVIADO') {
      await this.prisma.examInvite.update({
        where: { id: invite.id },
        data: { status: 'ABERTO', openedAt: new Date() },
      });
    }

    await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: invite.id,
        examRequestId: examRequest.id,
        eventType: 'LINK_ABERTO',
      },
    });

    return {
      sessionToken,
      processId: examRequest.id,
      patientName: patient.name,
      companyName: invite.company?.nomeFantasia ?? invite.company?.name ?? '',
      examPurpose: invite.examType,
    };
  }

  async getProcesso(patientId: string, processId: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: processId },
      include: {
        patient: true,
        clinic: true,
        invite: { include: { company: true } },
        asoDocuments: { orderBy: { signedAt: 'desc' }, take: 1 },
        results: { include: { type: true } },
        timelineEvents: { orderBy: { occurredAt: 'asc' } },
        teleconsultations: { orderBy: { startedAt: 'desc' }, take: 1 },
        documents: true,
      },
    });

    if (!request || request.patientId !== patientId) {
      throw new NotFoundException('Processo não encontrado');
    }

    const latestVideoSessionId = request.teleconsultations[0]?.videoSessionId ?? null;
    const effectiveStatus = latestVideoSessionId && request.status !== 'CONCLUIDO'
      ? 'EM_ATENDIMENTO_MEDICO'
      : request.status;

    const proximaAcao = this.calcularProximaAcao(effectiveStatus, {
      hasDocuments: request.documents.length > 0,
      requiredDocsOk: await this.verificarDocumentosObrigatorios(patientId, processId),
      hasAnamnese: await this.prisma.anamnese.findFirst({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
      clinicAddress: request.clinic?.address ?? null,
      videoSessionId: latestVideoSessionId,
      asoPdfUrl: request.asoDocuments[0]?.pdfUrl ?? null,
    });

    const documentos: { tipo: string; enviado: boolean; fileUrl: string | null }[] = request.documents.map(d => ({
      tipo: d.tipo,
      enviado: true,
      fileUrl: d.fileUrl,
    }));

    const requiredTypes = ['rg', 'foto'];
    for (const tipo of requiredTypes) {
      if (!documentos.find(d => d.tipo === tipo)) {
        documentos.push({ tipo, enviado: false, fileUrl: null });
      }
    }

    const questionario = await this.prisma.anamnese.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    const aso = request.asoDocuments[0];
    const teleconsulta = request.teleconsultations[0];
    const timeline = request.timelineEvents.map(e => ({
      eventType: e.eventType,
      occurredAt: e.occurredAt,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }));

    return {
      id: request.id,
      status: effectiveStatus,
      proximaAcao,
      empresa: { nome: request.invite?.company?.nomeFantasia ?? request.invite?.company?.name ?? '' },
      paciente: {
        nome: request.patient.name,
        cpf: request.patient.cpf,
        birthDate: request.patient.birthDate,
        phone: request.patient.phone,
        email: null,
      },
      documentos,
      questionario: { respondido: !!questionario },
      teleconsulta: {
        disponivel: !!(teleconsulta?.videoSessionId),
        linkSala: teleconsulta?.videoSessionId ?? null,
      },
      aso: {
        disponivel: !!aso?.pdfUrl,
        pdfUrl: aso?.pdfUrl ?? null,
        decision: aso?.decision ?? null,
        validUntil: aso?.validUntil ?? null,
      },
      timeline,
      progresso: this.calcularProgresso(effectiveStatus, !!questionario, documentos),
    };
  }

  private calcularProximaAcao(status: string, extras: {
    hasDocuments: boolean;
    requiredDocsOk: boolean;
    hasAnamnese: any;
    clinicAddress: string | null;
    videoSessionId: string | null;
    asoPdfUrl: string | null;
  }) {
    if (status === 'AGUARDANDO_COLETA' && !extras.hasAnamnese) {
      return { tipo: 'CONFIRMAR_DADOS', titulo: 'Confirmar Dados', descricao: 'Confirme seus dados cadastrais', cta: 'Confirmar Dados', ctaUrl: '/portal/dados', endereco: null };
    }

    if (status === 'AGUARDANDO_COLETA' && extras.hasAnamnese && !extras.requiredDocsOk) {
      return { tipo: 'ENVIAR_DOCUMENTOS', titulo: 'Enviar Documentos', descricao: 'Envie RG e foto para dar continuidade', cta: 'Enviar Documentos', ctaUrl: '/portal/documentos', endereco: null };
    }

    if (status === 'DOCUMENTOS_PENDENTES' && !extras.requiredDocsOk) {
      return { tipo: 'ENVIAR_DOCUMENTOS', titulo: 'Enviar Documentos', descricao: 'Envie RG e foto para dar continuidade', cta: 'Enviar Documentos', ctaUrl: '/portal/documentos', endereco: null };
    }

    if (status === 'DOCUMENTOS_PENDENTES' && extras.requiredDocsOk && !extras.hasAnamnese) {
      return { tipo: 'RESPONDER_QUESTIONARIO', titulo: 'Responder Questionário', descricao: 'Preencha o questionário de saúde', cta: 'Responder', ctaUrl: '/portal/questionario', endereco: null };
    }

    if (status === 'AGUARDANDO_EXAMES') {
      return { tipo: 'COMPARECER_CLINICA', titulo: 'Comparecer à Clínica', descricao: 'Dirija-se à clínica para realização dos exames', cta: 'Ver Endereço', ctaUrl: '/portal/clinica', endereco: extras.clinicAddress };
    }

    if (status === 'EM_COLETA') {
      return { tipo: 'AGUARDAR_RESULTADOS', titulo: 'Aguardar Resultados', descricao: 'Seus exames estão sendo processados', cta: 'Acompanhar', ctaUrl: '/portal', endereco: null };
    }

    if (status === 'NA_FILA_MEDICA') {
      return { tipo: 'AGUARDAR_MEDICO', titulo: 'Aguardar Médico', descricao: 'Seu caso será analisado por um médico', cta: 'Acompanhar', ctaUrl: '/portal', endereco: null };
    }

    if (status === 'EM_ATENDIMENTO_MEDICO' && extras.videoSessionId) {
      return { tipo: 'ENTRAR_TELECONSULTA', titulo: 'Teleconsulta Disponível', descricao: 'Entre na sala de teleconsulta', cta: 'Entrar', ctaUrl: `/teleconsulta/${extras.videoSessionId}`, endereco: null };
    }

    if (status === 'CONCLUIDO' && extras.asoPdfUrl) {
      return { tipo: 'BAIXAR_ASO', titulo: 'ASO Disponível', descricao: 'Seu ASO está pronto para download', cta: 'Baixar ASO', ctaUrl: extras.asoPdfUrl, endereco: null };
    }

    if (status === 'CONCLUIDO') {
      return { tipo: 'CONCLUIDO', titulo: 'Processo Concluído', descricao: 'Seu processo foi finalizado com sucesso', cta: 'Ver Detalhes', ctaUrl: '/portal/aso', endereco: null };
    }

    return { tipo: 'AGUARDANDO', titulo: 'Aguardando', descricao: 'Seu processo está em andamento', cta: null, ctaUrl: null, endereco: null };
  }

  private async verificarDocumentosObrigatorios(patientId: string, processId: string): Promise<boolean> {
    const docs = await this.prisma.patientDocument.findMany({
      where: { patientId, requestId: processId },
    });
    const tipos = new Set(docs.map(d => d.tipo));
    return tipos.has('rg') && tipos.has('foto');
  }

  private calcularProgresso(status: string, hasAnamnese: boolean, documentos: any[]) {
    const docsOk = documentos.filter(d => d.enviado).length >= 2;
    const steps = [
      { label: 'Cadastro', concluido: true, ativo: true },
      { label: 'Documentos', concluido: docsOk, ativo: status === 'AGUARDANDO_COLETA' || status === 'DOCUMENTOS_PENDENTES' },
      { label: 'Questionário', concluido: hasAnamnese, ativo: status === 'DOCUMENTOS_PENDENTES' || status === 'QUESTIONARIO_PENDENTE' },
      { label: 'Exames', concluido: ['EM_COLETA', 'NA_FILA_MEDICA', 'EM_ATENDIMENTO_MEDICO', 'CONCLUIDO'].includes(status), ativo: status === 'AGUARDANDO_EXAMES' },
      { label: 'Médico', concluido: ['EM_ATENDIMENTO_MEDICO', 'CONCLUIDO'].includes(status), ativo: ['NA_FILA_MEDICA', 'EM_ATENDIMENTO_MEDICO'].includes(status) },
      { label: 'ASO', concluido: status === 'CONCLUIDO', ativo: status === 'CONCLUIDO' },
    ];
    return steps.map(s => ({
      ...s,
      ativo: s.ativo || !s.concluido,
    }));
  }

  async confirmarDados(processId: string, patientId: string, phone?: string, email?: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: processId },
      include: { invite: true },
    });
    if (!request || request.patientId !== patientId) {
      throw new NotFoundException('Processo não encontrado');
    }

    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.patient.update({
        where: { id: patientId },
        data: updateData,
      });
    }

    if (request.status === 'AGUARDANDO_COLETA') {
      await this.prisma.examRequest.update({
        where: { id: processId },
        data: { status: 'DOCUMENTOS_PENDENTES' },
      });
    }

    await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: request.inviteId,
        examRequestId: processId,
        eventType: 'DADOS_CONFIRMADOS',
      },
    });

    return { success: true };
  }

  async getStatusDocumentos(patientId: string, processId: string) {
    const docs = await this.prisma.patientDocument.findMany({
      where: { patientId, requestId: processId },
    });

    const tiposObrigatorios = ['rg', 'foto'];
    return tiposObrigatorios.map(tipo => ({
      tipo,
      enviado: docs.some(d => d.tipo === tipo),
      fileUrl: docs.find(d => d.tipo === tipo)?.fileUrl ?? null,
    }));
  }

  async enviarDocumento(processId: string, patientId: string, tipo: string, fileUrl: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: processId },
      include: { invite: true },
    });
    if (!request || request.patientId !== patientId) {
      throw new NotFoundException('Processo não encontrado');
    }

    await this.prisma.patientDocument.create({
      data: {
        patientId,
        requestId: processId,
        tipo,
        fileUrl,
        originalName: tipo,
      },
    });

    await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: request.inviteId,
        examRequestId: processId,
        eventType: 'DOCUMENTOS_ENVIADOS',
        metadata: JSON.stringify({ tipo }),
      },
    });

    const docsOk = await this.verificarDocumentosObrigatorios(patientId, processId);
    if (docsOk && request.status !== 'QUESTIONARIO_PENDENTE') {
      await this.prisma.examRequest.update({
        where: { id: processId },
        data: { status: 'QUESTIONARIO_PENDENTE' },
      });
    }

    return { success: true };
  }

  async responderQuestionario(processId: string, patientId: string, data: QuestionarioDto) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: processId },
      include: { invite: true, patient: true },
    });
    if (!request || request.patientId !== patientId) {
      throw new NotFoundException('Processo não encontrado');
    }

    const anamneseData: any = {};
    if (data.queixas) anamneseData.queixas = data.queixas;
    if (data.medicamentosEmUso) anamneseData.medicamentos = data.medicamentosEmUso;
    if (data.observacoes) anamneseData.historicoOcupacional = data.observacoes;

    const historicoParts: string[] = [];
    if (data.doencasPrevias) historicoParts.push(`Doenças Prévias: ${data.doencasPrevias}`);
    if (data.cirurgiasPrevias) historicoParts.push(`Cirurgias Prévias: ${data.cirurgiasPrevias}`);
    if (data.alergiasConhecidas) historicoParts.push(`Alergias: ${data.alergiasConhecidas}`);
    if (historicoParts.length > 0) anamneseData.historicoMedico = historicoParts.join('\n');

    const tabagismoLabels: Record<string, string> = {
      nao: 'Não fuma',
      ex_fumante: 'Ex-fumante',
      fumante: 'Fumante',
    };
    const alcoolLabels: Record<string, string> = {
      nao: 'Não consome álcool',
      social: 'Consumo social de álcool',
      frequente: 'Consumo frequente de álcool',
    };
    const atividadeLabels: Record<string, string> = {
      nao: 'Não pratica atividade física',
      ocasional: 'Atividade física ocasional',
      regular: 'Atividade física regular',
    };
    const habitosParts: string[] = [];
    if (data.tabagismo) {
      const detalhe = data.tabagismoDetalhe ? ` — ${data.tabagismoDetalhe}` : '';
      habitosParts.push(`Tabagismo: ${tabagismoLabels[data.tabagismo] || data.tabagismo}${detalhe}`);
    }
    if (data.alcool) {
      const detalhe = data.alcoolDetalhe ? ` — ${data.alcoolDetalhe}` : '';
      habitosParts.push(`Álcool: ${alcoolLabels[data.alcool] || data.alcool}${detalhe}`);
    }
    if (data.atividadeFisica && data.atividadeFisica !== 'nao_informado') {
      habitosParts.push(`Atividade física: ${atividadeLabels[data.atividadeFisica] || data.atividadeFisica}`);
    }
    if (data.sono) habitosParts.push(`Sono: ${data.sono}`);
    if (habitosParts.length > 0) anamneseData.habitos = habitosParts.join('\n');

    const ocupacionalParts: string[] = [];
    if (data.observacoes) ocupacionalParts.push(data.observacoes);
    if (data.declaracaoVeracidade) {
      ocupacionalParts.push('Declaração: paciente confirmou que as informações fornecidas são verdadeiras e completas.');
    }
    if (ocupacionalParts.length > 0) {
      anamneseData.historicoOcupacional = ocupacionalParts.join('\n\n');
    }

    const existingAnamnese = await this.prisma.anamnese.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAnamnese) {
      await this.prisma.anamnese.update({
        where: { id: existingAnamnese.id },
        data: anamneseData,
      });
    } else {
      await this.prisma.anamnese.create({
        data: { patientId, ...anamneseData },
      });
    }

    await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: request.inviteId,
        examRequestId: processId,
        eventType: 'QUESTIONARIO_RESPONDIDO',
      },
    });

    let nextStatus = 'NA_FILA_MEDICA';
    if (request.patient.functionCboCode) {
      const risk = await this.prisma.occupationalRisk.findUnique({
        where: { cboCode: request.patient.functionCboCode },
      });
      if (risk && (risk.requiresInPerson || (risk.requiredExams && risk.requiredExams.length > 0))) {
        nextStatus = 'AGUARDANDO_EXAMES';
      }
    }

    await this.prisma.examRequest.update({
      where: { id: processId },
      data: { status: nextStatus },
    });

    if (nextStatus === 'NA_FILA_MEDICA') {
      await this.queueService.enqueue(processId);
    }

    return { success: true, status: nextStatus };
  }

  async getAso(processId: string, patientId: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: processId },
      include: { asoDocuments: { orderBy: { signedAt: 'desc' }, take: 1 } },
    });
    if (!request || request.patientId !== patientId) {
      throw new NotFoundException('Processo não encontrado');
    }

    const aso = request.asoDocuments[0];
    return {
      pdfUrl: aso?.pdfUrl ?? null,
      decision: aso?.decision ?? null,
      validUntil: aso?.validUntil ?? null,
    };
  }

  async preview(token: string) {
    const invite = await this.prisma.examInvite.findUnique({
      where: { token },
      include: { company: true },
    });
    if (!invite) {
      return { expirado: true, empresaNome: null, tipoExame: null };
    }
    const expirado = invite.expiresAt < new Date() || invite.status === 'EXPIRADO';
    return { expirado, empresaNome: invite.company?.nomeFantasia ?? invite.company?.name ?? '', tipoExame: invite.examType };
  }
}
