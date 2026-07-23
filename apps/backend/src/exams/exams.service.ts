import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentFlow, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { QueueService } from '../queue/queue.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ClinicActorService } from '../auth/clinic-actor.service';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyGateway: CompanyGateway,
    private readonly queueService: QueueService,
    private readonly clinicActors: ClinicActorService,
  ) {}

  async createExam(
    examRequestId: string,
    examType: string,
    valueJson: Record<string, any>,
    attachmentUrl?: string,
    actor?: JwtPayload,
  ) {
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

    if (!actor)
      throw new BadRequestException('Profissional ativo nao identificado');
    const activeActor = await this.clinicActors.resolve(
      actor,
      request.clinicId,
    );

    if (examType === 'outros' && !String(valueJson?.nome_exame ?? '').trim()) {
      throw new BadRequestException('Nome do exame adicional nao informado');
    }

    const cboCode = request.patient.functionCboCode;
    if (cboCode) {
      const risk = await this.prisma.occupationalRisk.findUnique({
        where: { cboCode },
      });
      const requiredExams = risk?.requiredExams ?? [];

      if (
        requiredExams.length > 0 &&
        examType !== 'outros' &&
        !requiredExams.includes(examType)
      ) {
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
      const missingFields = requiredFields.filter((field) => !valueJson[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        );
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

    let result;
    try {
      result = await this.prisma.examResult.create({
        data: {
          requestId: examRequestId,
          typeId: examTypeRecord.id,
          valueJson: JSON.stringify(valueJson),
          attachmentUrl: attachmentUrl || null,
          collectedById: activeActor.operatorId ?? null,
          performedByType: activeActor.actorType,
          performedById: activeActor.actorId,
          performedByName: activeActor.actorName,
          actorSessionId: activeActor.actorSessionId ?? null,
          source: 'manual',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este exame ja foi registrado para a solicitacao.',
        );
      }
      throw error;
    }

    await this.prisma.examRequest.update({
      where: { id: examRequestId },
      data: { status: 'EM_COLETA' },
    });
    await this.clinicActors.audit(
      activeActor,
      'EXAM_RESULT_RECORDED',
      'EXAM_REQUEST',
      examRequestId,
      { examType, examResultId: result.id },
    );

    return result;
  }

  async sendToMedicalQueue(examRequestId: string, user: JwtPayload) {
    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: { invite: { include: { company: true } }, clinic: true },
    });

    if (!request) {
      throw new NotFoundException('ExamRequest não encontrado');
    }
    const activeActor = await this.clinicActors.resolve(user, request.clinicId);

    await this.prisma.examRequest.update({
      where: { id: examRequestId },
      data: { status: 'NA_FILA_MEDICA' },
    });

    await this.queueService.enqueue(examRequestId);
    await this.clinicActors.audit(
      activeActor,
      'PATIENT_SENT_TO_MEDICAL_QUEUE',
      'EXAM_REQUEST',
      examRequestId,
    );

    return { success: true };
  }

  async findTypes() {
    return this.prisma.examType.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        requiresEquipment: true,
        canBeRemoteReview: true,
      },
    });
  }

  async findRequiredByCbo(cboCode: string) {
    const risk = await this.prisma.occupationalRisk.findUnique({
      where: { cboCode },
    });
    if (!risk)
      return {
        requiredExams: [],
        riskGrade: 'desconhecido',
        requiresInPerson: false,
      };
    return {
      requiredExams: risk.requiredExams,
      riskGrade: risk.riskGrade,
      requiresInPerson: risk.requiresInPerson,
    };
  }

  async searchByFunctionName(query: string) {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return [];

    const normalizedCodeQuery = trimmedQuery.replace(/\D/g, '');
    return this.prisma.occupationalRisk.findMany({
      where: {
        OR: [
          { functionName: { contains: trimmedQuery, mode: 'insensitive' } },
          { cboCode: { contains: trimmedQuery } },
          ...(normalizedCodeQuery.length >= 4
            ? [
                {
                  cboCode: {
                    contains: `${normalizedCodeQuery.slice(0, 4)}-${normalizedCodeQuery.slice(4)}`,
                  },
                },
              ]
            : []),
        ],
      },
      select: { cboCode: true, functionName: true },
      take: 15,
      orderBy: { functionName: 'asc' },
    });
  }

  async createPatient(
    data: {
      name: string;
      cpf: string;
      phone?: string;
      functionCboCode?: string;
      examPurpose: string;
      clinicId?: string;
      inviteId?: string;
      paymentId: string;
    },
    requestUser: JwtPayload,
  ) {
    const activeActor = await this.clinicActors.resolve(requestUser);
    const [clinic, payment] = await Promise.all([
      this.prisma.clinic.findUnique({
        where: { id: activeActor.clinicId },
        select: { environment: true },
      }),
      this.prisma.payment.findUnique({
        where: { id: data.paymentId },
        select: {
          id: true,
          flow: true,
          status: true,
          clinicId: true,
          examRequest: { select: { id: true } },
        },
      }),
    ]);
    if (!clinic) throw new BadRequestException('Clinica nao encontrada.');
    if (
      !payment ||
      payment.flow !== PaymentFlow.CLINIC_WALK_IN ||
      payment.status !== PaymentStatus.PAGO
    ) {
      throw new BadRequestException(
        'O atendimento exige um pagamento presencial confirmado.',
      );
    }
    if (payment.clinicId && payment.clinicId !== activeActor.clinicId) {
      throw new BadRequestException('O pagamento pertence a outra clinica.');
    }
    if (payment.examRequest) {
      throw new BadRequestException(
        'Este pagamento ja foi usado em outro atendimento.',
      );
    }
    const existingPatient = await this.prisma.patient.findFirst({
      where: { cpf: data.cpf, environment: clinic.environment },
    });

    if (existingPatient) {
      const existingRequest = await this.prisma.examRequest.findFirst({
        where: {
          patientId: existingPatient.id,
          clinicId: activeActor.clinicId,
          environment: clinic.environment,
          status: { not: 'CONCLUIDO' },
        },
      });
      if (existingRequest) {
        return {
          patient: existingPatient,
          examRequest: existingRequest,
          existing: true,
        };
      }

      const examRequest = await this.prisma.examRequest.create({
        data: {
          patientId: existingPatient.id,
          clinicId: activeActor.clinicId,
          environment: clinic.environment,
          source: data.inviteId ? 'convite' : 'direto',
          examPurpose: data.examPurpose,
          status: 'AGUARDANDO_COLETA',
          inviteId: data.inviteId,
          paymentId: payment.id,
        },
      });
      await this.clinicActors.audit(
        activeActor,
        'PATIENT_CHECKED_IN',
        'EXAM_REQUEST',
        examRequest.id,
      );
      return { patient: existingPatient, examRequest };
    }

    const patientUser = await this.prisma.userAccount.create({
      data: {
        email: `${clinic.environment.toLowerCase()}.${data.cpf}@walkin.temp`,
        passwordHash: await bcrypt.hash(randomUUID(), 12),
        role: 'PATIENT',
      },
    });

    const patient = await this.prisma.patient.create({
      data: {
        userId: patientUser.id,
        cpf: data.cpf,
        name: data.name,
        phone: data.phone ?? '',
        functionCboCode: data.functionCboCode ?? '0000-00',
        environment: clinic.environment,
      },
    });

    const examRequest = await this.prisma.examRequest.create({
      data: {
        patientId: patient.id,
        clinicId: activeActor.clinicId,
        environment: clinic.environment,
        source: data.inviteId ? 'convite' : 'direto',
        examPurpose: data.examPurpose,
        status: 'AGUARDANDO_COLETA',
        inviteId: data.inviteId,
        paymentId: payment.id,
      },
    });

    await this.clinicActors.audit(
      activeActor,
      'PATIENT_CHECKED_IN',
      'EXAM_REQUEST',
      examRequest.id,
    );
    return { patient, examRequest };
  }
}
