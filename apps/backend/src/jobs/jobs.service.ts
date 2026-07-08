import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { CompanyGateway } from '../company/company.gateway';
import { MailService } from '../mail/mail.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyGateway: CompanyGateway,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirarConvitesVencidos() {
    const result = await this.prisma.examInvite.updateMany({
      where: {
        status: { in: ['ENVIADO', 'ABERTO'] as any },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRADO' as any },
    });
    this.logger.log(`Convites expirados: ${result.count}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async verificarDocumentosVencidos() {
    const now = new Date();
    const empresas = await this.prisma.company.findMany({
      where: {
        status: 'LIBERADA',
        OR: [
          { pcmsoValidUntil: { lt: now } },
          { ppraValidUntil: { lt: now } },
        ],
      },
    });

    for (const empresa of empresas) {
      await this.prisma.company.update({
        where: { id: empresa.id },
        data: { status: 'DOCUMENTACAO_VENCIDA' },
      });
    }
    this.logger.log(`Empresas com documentação vencida: ${empresas.length}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async avisarAsosProximosDoVencimento() {
    const alertWindows = [30, 15, 7];
    const now = new Date();
    let totalAlerts = 0;

    for (const windowDays of alertWindows) {
      const start = new Date(now);
      start.setDate(start.getDate() + windowDays);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const asos = await this.prisma.asoDocument.findMany({
        where: {
          decision: { equals: 'APTO', mode: 'insensitive' },
          validUntil: { gte: start, lte: end },
        },
        include: {
          request: {
            include: {
              patient: {
                include: {
                  companies: {
                    where: { OR: [{ endDate: null }, { endDate: { gte: now } }] },
                    include: { company: true },
                  },
                },
              },
              invite: true,
            },
          },
        },
      });

      const byCompany = new Map<string, { company: any; items: typeof asos }>();
      for (const aso of asos) {
        for (const relation of aso.request.patient.companies) {
          const current = byCompany.get(relation.companyId) ?? { company: relation.company, items: [] };
          current.items.push(aso);
          byCompany.set(relation.companyId, current);
        }
      }

      for (const [companyId, group] of byCompany) {
        const payloadItems = group.items.map((aso) => ({
          asoId: aso.id,
          patientName: aso.request.patient.name,
          examType: aso.request.invite?.examType ?? aso.request.examPurpose,
          validUntil: aso.validUntil!.toISOString(),
          daysUntilExpiration: windowDays,
        }));

        this.companyGateway.emitAsoExpirationAlert(companyId, {
          windowDays,
          total: payloadItems.length,
          asos: payloadItems,
        });

        if (group.company.contactEmail) {
          try {
            await this.mailService.sendAsoExpirationAlert(
              group.company.contactEmail,
              group.company.nomeFantasia ?? group.company.razaoSocial ?? group.company.name ?? 'Empresa',
              group.items.map((aso) => ({
                patientName: aso.request.patient.name,
                examType: aso.request.invite?.examType ?? aso.request.examPurpose,
                validUntil: aso.validUntil!,
                daysUntilExpiration: windowDays,
              })),
            );
          } catch (err) {
            this.logger.error(`Falha ao enviar aviso de ASO para ${group.company.contactEmail}`, err);
          }
        }

        totalAlerts += payloadItems.length;
      }
    }

    this.logger.log(`Avisos de ASO proximo do vencimento: ${totalAlerts}`);
  }
}
