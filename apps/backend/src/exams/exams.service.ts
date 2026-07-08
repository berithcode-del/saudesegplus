import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyGateway: CompanyGateway,
    private readonly queueService: QueueService,
  ) {}

  async createExam(examRequestId: string, examType: string, valueJson: Record<string, any>, attachmentUrl?: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: { patient: true },
    });

    if (!request) {
      throw new NotFoundException('ExamRequest não encontrado');
    }

    if (!examType) {
      throw new BadRequestException('Tipo de exame nao informado');
    }

    const operator = await this.resolveOperator(request.clinicId);
    if (!operator) {
      throw new BadRequestException('Nenhum operador cadastrado para a clínica informada. Cadastre um operador antes de registrar exames.');
    }

    if (examType === 'outros' && !String(valueJson?.nome_exame ?? '').trim()) {
      throw new BadRequestException('Nome do exame adicional nao informado');
    }

    const cboCode = request.patient.functionCboCode;
    if (cboCode) {
      const risk = await this.prisma.occupationalRisk.findUnique({ where: { cboCode } });
      const requiredExams = risk?.requiredExams ?? [];

      if (requiredExams.length > 0 && examType !== 'outros' && !requiredExams.includes(examType)) {
        throw new BadRequestException(
          `Exame "${examType}" nao e obrigatorio para o CBO ${cboCode}. Se for adicional, registre como "outros".`,
        );
      }
    }

    const requiredFields = {
      pa: ['pressao_sistolica', 'pressao_diastolica'],
      audiometria: ['via_aerea_od', 'via_aerea_oe'],
      acuidade_visual: ['od', 'oe'],
    }[examType];

    if (requiredFields && !attachmentUrl) {
      const missingFields = requiredFields.filter(field => !valueJson[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }
    }

    let examTypeRecord = await this.prisma.examType.findFirst({
      where: { name: examType },
    });

    if (!examTypeRecord) {
      examTypeRecord = await this.prisma.examType.create({
        data: {
          name: examType,
          category: 'outros',
          requiresEquipment: false,
          canBeRemoteReview: true,
          validityDays: 365,
        },
      });
    }

    const result = await this.prisma.examResult.create({
      data: {
        requestId: examRequestId,
        typeId: examTypeRecord.id,
        valueJson: JSON.stringify(valueJson),
        attachmentUrl: attachmentUrl || null,
        collectedById: operator.id,
        source: 'manual',
      },
    });

    await this.prisma.examRequest.update({
      where: { id: examRequestId },
      data: { status: 'EM_COLETA' },
    });

    return result;
  }

  async sendToMedicalQueue(examRequestId: string) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: { invite: { include: { company: true } }, clinic: true },
    });

    if (!request) {
      throw new NotFoundException('ExamRequest não encontrado');
    }

    await this.prisma.examRequest.update({
      where: { id: examRequestId },
      data: { status: 'NA_FILA_MEDICA' },
    });

    await this.queueService.enqueue(examRequestId);

    return { success: true };
  }

  async findTypes() {
    return this.prisma.examType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, category: true, requiresEquipment: true, canBeRemoteReview: true } });
  }

  async findRequiredByCbo(cboCode: string) {
    const risk = await this.prisma.occupationalRisk.findUnique({ where: { cboCode } });
    if (!risk) return { requiredExams: [], riskGrade: 'desconhecido', requiresInPerson: false };
    return {
      requiredExams: risk.requiredExams,
      riskGrade: risk.riskGrade,
      requiresInPerson: risk.requiresInPerson,
    };
  }

  async searchByFunctionName(query: string) {
    if (!query || query.length < 2) return [];
    return this.prisma.occupationalRisk.findMany({
      where: {
        functionName: { contains: query, mode: 'insensitive' },
      },
      select: { cboCode: true, functionName: true },
      take: 15,
      orderBy: { functionName: 'asc' },
    });
  }

  async resolveOperator(clinicId?: string | null) {
    if (!clinicId) return null;
    const operator = await this.prisma.operator.findFirst({ where: { clinicId } });
    if (operator) return operator;
    return null;
  }

  async createPatient(data: {
    name: string;
    cpf: string;
    phone?: string;
    functionCboCode?: string;
    examPurpose: string;
    clinicId?: string;
    inviteId?: string;
  }) {
    const existingPatient = await this.prisma.patient.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingPatient) {
      const existingRequest = await this.prisma.examRequest.findFirst({
        where: { patientId: existingPatient.id, status: { not: 'CONCLUIDO' } },
      });
      if (existingRequest) {
        return { patient: existingPatient, examRequest: existingRequest, existing: true };
      }

      const examRequest = await this.prisma.examRequest.create({
        data: {
          patientId: existingPatient.id,
          clinicId: data.clinicId,
          source: data.inviteId ? 'convite' : 'direto',
          examPurpose: data.examPurpose,
          status: 'AGUARDANDO_COLETA',
          inviteId: data.inviteId,
        },
      });
      return { patient: existingPatient, examRequest };
    }

    const user = await this.prisma.userAccount.create({
      data: {
        email: `${data.cpf}@walkin.temp`,
        passwordHash: 'walkin_temp',
        role: 'PATIENT',
      },
    });

    const patient = await this.prisma.patient.create({
      data: {
        userId: user.id,
        cpf: data.cpf,
        name: data.name,
        phone: data.phone ?? '',
        functionCboCode: data.functionCboCode ?? '0000-00',
      },
    });

    const examRequest = await this.prisma.examRequest.create({
      data: {
        patientId: patient.id,
        clinicId: data.clinicId,
        source: data.inviteId ? 'convite' : 'direto',
        examPurpose: data.examPurpose,
        status: 'AGUARDANDO_COLETA',
        inviteId: data.inviteId,
      },
    });

    return { patient, examRequest };
  }
}
