import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
import { basename } from 'path';

@Injectable()
export class ClinicProfileService {
  constructor(
    private prisma: PrismaService,
    private storage: SupabaseStorageService,
  ) {}

  private async getOwnClinicId(userId: string): Promise<string | null> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { clinicProfile: true, operatorProfile: { select: { clinicId: true } } },
    });
    return user?.clinicProfile?.id ?? user?.operatorProfile?.clinicId ?? null;
  }

  async listClinicAsos(userId: string) {
    const clinicId = await this.getOwnClinicId(userId);
    if (!clinicId) throw new NotFoundException('Perfil de clínica não encontrado');

    const now = new Date();
    const asos = await this.prisma.asoDocument.findMany({
      where: {
        pdfUrl: { not: null },
        validUntil: { gte: now },
        request: {
          clinicId,
        },
      },
      include: {
        request: {
          include: {
            patient: true,
            invite: true,
          },
        },
        doctor: true,
      },
      orderBy: { validUntil: 'asc' },
    });

    return asos.map((aso) => {
          const validUntil = aso.validUntil as Date;
          const signedAt = aso.signedAt ?? aso.request.createdAt;
          const daysUntilExpiration = Math.ceil(
            (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          return {
            id: aso.id,
            requestId: aso.requestId,
            numeroProtocolo: aso.request.processoAso?.numeroProtocolo ?? null,
            processoAsoId: aso.request.processoAsoId ?? null,
            collaborator: {
              id: aso.request.patient.id,
              name: aso.request.patient.name,
              cpf: aso.request.patient.cpf,
              functionCboCode: aso.request.patient.functionCboCode,
            },
            examType: aso.request.invite?.examType ?? aso.request.examPurpose,
            examPurpose: aso.request.examPurpose,
            issuedAt: signedAt.toISOString(),
            validUntil: validUntil.toISOString(),
            daysUntilExpiration,
            decision: aso.decision,
            restrictionNotes: aso.restrictionNotes,
            pdfUrl: aso.pdfUrl,
            doctor: {
              id: aso.doctor.id,
              name: aso.doctor.name,
              crm: `${aso.doctor.crmNumber}/${aso.doctor.crmState}`,
            },
          };
        });
  }

  async getClinicAsoPdf(userId: string, asoId: string) {
    const clinicId = await this.getOwnClinicId(userId);
    if (!clinicId) throw new NotFoundException('Perfil de clínica não encontrado');

    const now = new Date();
    const aso = await this.prisma.asoDocument.findFirst({
      where: {
        id: asoId,
        pdfUrl: { not: null },
        validUntil: { gte: now },
        request: {
          clinicId,
        },
      },
    });
    if (!aso?.pdfUrl) throw new NotFoundException('ASO nao encontrado');

    const fileName = basename(aso.pdfUrl);
    return { buffer: await this.storage.downloadAsoFile(fileName), fileName };
  }
}