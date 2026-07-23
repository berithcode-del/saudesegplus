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
import { createSignatureProvider } from './signature-provider';

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

    const providerName = process.env.SIGNATURE_PROVIDER ?? doctor.signatureProvider ?? 'MOCK';
    const certificate = await this.prisma.doctorCertificate.findFirst({
      where: { doctorId: doctor.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (providerName !== 'MOCK') {
      if (!doctor.verifiedAt) {
        throw new ForbiddenException('Medico precisa estar verificado para assinar com A3');
      }
      if (!certificate || certificate.validUntil < new Date()) {
        throw new BadRequestException('Cadastre um certificado A3 ativo antes de assinar');
      }
    }

    await this.audit(doctor.id, providerName, 'ASO_SIGNATURE_REQUESTED', asoDocumentId, {
      hasCertificate: Boolean(certificate),
    });

    let signature;
    try {
      signature = await createSignatureProvider(providerName).sign({
        documentId: asoDocumentId,
        doctorId: doctor.id,
        certificateThumbprint: certificate?.certificateThumbprint,
      });
    } catch (error) {
      await this.audit(doctor.id, providerName, 'ASO_SIGNATURE_FAILED', asoDocumentId, {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Falha ao assinar documento',
      );
    }

    const updated = await this.prisma.asoDocument.update({
      where: { id: asoDocumentId },
      data: {
        signedAt: new Date(),
        signatureProviderId: signature.signatureProviderId,
        signatureProvider: signature.providerName,
        certificateThumbprint: signature.certificateThumbprint,
        signaturePolicy: signature.signaturePolicy,
        signatureTimestamp: signature.signatureTimestamp,
      },
    });

    await this.audit(doctor.id, signature.providerName, 'ASO_SIGNED_OK', asoDocumentId, {
      signatureProviderId: signature.signatureProviderId,
    });

    return {
      success: true,
      signedAt: updated.signedAt,
      provider: signature.providerName,
      message:
        signature.providerName === 'MOCK'
          ? 'Assinatura mock concluída; configure um provider A3 para validade ICP-Brasil.'
          : 'Assinatura digital registrada.',
    };
  }

  async registerCertificate(
    userId: string,
    body: {
      providerName?: string;
      certificateThumbprint: string;
      certificateSubjectDN: string;
      issuerDN: string;
      validFrom: string;
      validUntil: string;
    },
  ) {
    const doctor = await this.getAuthenticatedDoctor(userId);
    if (!doctor.verifiedAt) {
      throw new ForbiddenException('Medico precisa estar verificado para cadastrar certificado');
    }
    const validUntil = new Date(body.validUntil);
    if (Number.isNaN(validUntil.getTime()) || validUntil < new Date()) {
      throw new BadRequestException('Certificado expirado ou validade invalida');
    }
    const providerName = body.providerName ?? process.env.SIGNATURE_PROVIDER ?? 'MOCK';
    const certificate = await this.prisma.doctorCertificate.create({
      data: {
        doctorId: doctor.id,
        providerName,
        certificateThumbprint: body.certificateThumbprint.trim(),
        certificateSubjectDN: body.certificateSubjectDN.trim(),
        issuerDN: body.issuerDN.trim(),
        validFrom: new Date(body.validFrom),
        validUntil,
      },
    });
    await this.prisma.doctor.update({
      where: { id: doctor.id },
      data: { signatureProvider: providerName },
    });
    await this.audit(doctor.id, providerName, 'DOCTOR_CERT_REGISTERED', undefined, {
      certificateThumbprint: certificate.certificateThumbprint,
      validUntil: certificate.validUntil,
    });
    return certificate;
  }

  async listCertificates(userId: string) {
    const doctor = await this.getAuthenticatedDoctor(userId);
    return this.prisma.doctorCertificate.findMany({
      where: { doctorId: doctor.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeCertificate(userId: string, certificateId: string) {
    const doctor = await this.getAuthenticatedDoctor(userId);
    const updated = await this.prisma.doctorCertificate.updateMany({
      where: { id: certificateId, doctorId: doctor.id },
      data: { status: 'REVOKED' },
    });
    if (!updated.count) throw new NotFoundException('Certificado nao encontrado');
    return { success: true };
  }

  async verifyAsoDocument(asoDocumentId: string) {
    const doc = await this.prisma.asoDocument.findUnique({ where: { id: asoDocumentId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return {
      signatureValid: Boolean(doc.signedAt && doc.signatureProviderId),
      certificateValid: Boolean(doc.certificateThumbprint),
      providerName: doc.signatureProvider ?? null,
      thumbprint: doc.certificateThumbprint ?? null,
      signedAt: doc.signedAt,
      policyOid: doc.signaturePolicy ?? null,
      signatureTimestamp: doc.signatureTimestamp ?? null,
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

  private async audit(
    doctorId: string,
    providerName: string,
    action: string,
    documentId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.signatureAudit.create({
      data: {
        doctorId,
        providerName,
        action,
        documentId,
        metadata: metadata as any,
      },
    });
  }
}
