import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SignatureService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAuthenticatedDoctor(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor)
      throw new UnauthorizedException('Perfil médico não encontrado');
    return doctor;
  }

  async generateLink(examRequestId: string, userId: string) {
    const doctor = await this.getAuthenticatedDoctor(userId);
    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: { queueEntry: true },
    });
    if (!request) throw new NotFoundException('Solicitação não encontrada');
    if (
      request.queueEntry?.assignedDoctorId &&
      request.queueEntry.assignedDoctorId !== doctor.id
    ) {
      throw new ForbiddenException(
        'Esta solicitação está atribuída a outro médico',
      );
    }

    const pendingDocument = await this.prisma.asoDocument.findFirst({
      where: { requestId: examRequestId, doctorId: doctor.id, signedAt: null },
      orderBy: { id: 'desc' },
    });
    const asoDoc =
      pendingDocument ??
      (await this.prisma.asoDocument.create({
        data: {
          requestId: examRequestId,
          doctorId: doctor.id,
          decision: 'PENDENTE',
          signatureProviderId: `mock_provider_${Date.now()}`,
        },
      }));

    return {
      url: `/api/signature/sign/${asoDoc.id}`,
      asoDocumentId: asoDoc.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async signDocument(asoDocumentId: string, userId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('O PIN deve conter exatamente 4 dígitos');
    }

    const doctor = await this.getAuthenticatedDoctor(userId);
    const doc = await this.prisma.asoDocument.findUnique({
      where: { id: asoDocumentId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    if (doc.doctorId !== doctor.id) {
      throw new ForbiddenException('Você não pode assinar este documento');
    }
    if (!doctor.signaturePin) {
      throw new BadRequestException('Cadastre seu PIN em Configurações');
    }
    if (!(await bcrypt.compare(pin, doctor.signaturePin))) {
      throw new BadRequestException('PIN incorreto');
    }

    const updated = await this.prisma.asoDocument.update({
      where: { id: asoDocumentId },
      data: { signedAt: new Date() },
    });

    return {
      success: true,
      signedAt: updated.signedAt,
      provider: 'mock',
      message:
        'Assinatura mock concluída; a integração A3 substituirá esta etapa futuramente.',
    };
  }

  async handleWebhook(
    payload: { document_id: string; signed_at: string },
    providedSecret?: string,
  ) {
    const expectedSecret = process.env.SIGNATURE_WEBHOOK_SECRET;
    if (
      !expectedSecret ||
      !providedSecret ||
      expectedSecret.length !== providedSecret.length ||
      !timingSafeEqual(Buffer.from(expectedSecret), Buffer.from(providedSecret))
    ) {
      throw new UnauthorizedException('Webhook de assinatura não autorizado');
    }

    await this.prisma.asoDocument.update({
      where: { id: payload.document_id },
      data: { signedAt: new Date(payload.signed_at) },
    });
    console.log(
      `[Webhook] Documento ${payload.document_id} assinado em ${payload.signed_at}`,
    );
    return { success: true };
  }
}
