import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { FinancialService } from '../financial/financial.service';
import * as puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AsoService {
  private readonly logger = new Logger(AsoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly financialService: FinancialService,
  ) {}

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatExamPurpose(value: string) {
    const labels: Record<string, string> = {
      admissional: 'Admissional',
      periodico: 'Periódico',
      periódico: 'Periódico',
      demissional: 'Demissional',
      mudanca_funcao: 'Mudança de Função',
      'mudança de função': 'Mudança de Função',
      retorno_trabalho: 'Retorno ao Trabalho',
      'retorno ao trabalho': 'Retorno ao Trabalho',
    };
    return labels[value.toLocaleLowerCase('pt-BR')] ?? value;
  }

  private formatBirthDate(birthDate?: Date | null) {
    if (!birthDate) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    )
      age--;
    return `${birthDate.toLocaleDateString('pt-BR')} (${age} anos)`;
  }

  async generatePdf(
    examRequestId: string,
    userId: string,
    decision: string,
    restrictionNotes?: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Perfil médico não encontrado');

    const request = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: {
        patient: true,
        clinic: true,
        invite: { include: { company: true } },
        results: { include: { type: true } },
      },
    });
    if (!request) throw new NotFoundException('Solicitação não encontrada');

    const asoDoc = await this.prisma.asoDocument.findFirst({
      where: {
        requestId: examRequestId,
        doctorId: doctor.id,
        signedAt: { not: null },
      },
      orderBy: { signedAt: 'desc' },
    });
    if (!asoDoc) {
      throw new ForbiddenException(
        'O documento precisa ser assinado antes da geração do PDF',
      );
    }

    const occupationalRisk = request.patient.functionCboCode
      ? await this.prisma.occupationalRisk.findUnique({
          where: { cboCode: request.patient.functionCboCode },
        })
      : null;
    const todayPtBr = new Date().toLocaleDateString('pt-BR');
    const isApto = decision !== 'INAPTO';
    const company = request.invite?.company;
    const verificationBaseUrl =
      process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const proceduresRowsHtml = request.results
      .map((result) => {
        const code = result.type.id.slice(0, 6).toUpperCase();
        const name = this.escapeHtml(result.type.name);
        const date = result.collectedAt.toLocaleDateString('pt-BR');
        return `<tr><td class="proc-code">${code}</td><td>${name}</td><td class="proc-date">${date}</td></tr>`;
      })
      .join('');
    const riskFactorsHtml = occupationalRisk
      ? `<li>${this.escapeHtml(`Grau de risco: ${occupationalRisk.riskGrade}`)}</li>`
      : '';

    const rawData: Record<string, string> = {
      asoNumero: asoDoc.id.slice(0, 8).toUpperCase(),
      patientName: request.patient.name,
      patientCpf: request.patient.cpf,
      patientNascimento: this.formatBirthDate(request.patient.birthDate),
      cargoFuncao:
        request.invite?.roleFunction ?? occupationalRisk?.functionName ?? '',
      cboCode: request.patient.functionCboCode ?? '',
      setorCargo: '',
      companyName:
        company?.razaoSocial ?? company?.nomeFantasia ?? company?.name ?? '',
      companyCnpj: company?.cnpj ?? '',
      companyEndereco: company?.address ?? '',
      clinicName: request.clinic?.name ?? '',
      clinicAddress: request.clinic?.address ?? '',
      clinicCnpj: request.clinic?.cnpj ?? '',
      clinicPhone: request.clinic?.phone ?? '',
      examPurpose: request.examPurpose,
      tipoExame: this.formatExamPurpose(request.examPurpose),
      examDate: todayPtBr,
      decision,
      restrictionNotes: restrictionNotes ?? '',
      doctorName: doctor.name,
      doctorCrm: `${doctor.crmNumber} ${doctor.crmState}`,
      signatureDate: asoDoc.signedAt?.toLocaleDateString('pt-BR') ?? todayPtBr,
      verificationCode: asoDoc.id.slice(0, 12).toUpperCase(),
      verificationUrl: `${verificationBaseUrl}/verificar/${asoDoc.id}`,
      requiresAltura: '',
      requiresConfinado: '',
      alturaAptoMark: '',
      alturaInaptoMark: '',
      confinadoAptoMark: '',
      confinadoInaptoMark: '',
      geralAptoMark: isApto ? '✕' : '',
      geralInaptoMark: isApto ? '' : '✕',
      riskFactorsHtml,
      proceduresRowsHtml,
    };
    const htmlKeys = new Set(['riskFactorsHtml', 'proceduresRowsHtml']);
    const data = Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [
        key,
        htmlKeys.has(key) ? value : this.escapeHtml(value),
      ]),
    );

    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'libs',
      'pdf-template-aso.html',
    );
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_match: string, varName: string, content: string) =>
        data[varName] ? content : '',
    );
    Object.entries(data).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    });

    const pdfDir = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'uploads',
      'aso',
    );
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `aso-${asoDoc.id}.pdf`);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH ?? undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    } finally {
      await browser.close();
    }

    const pdfUrl = `/uploads/aso/aso-${asoDoc.id}.pdf`;
    await this.prisma.asoDocument.update({
      where: { id: asoDoc.id },
      data: {
        pdfUrl,
        decision,
        restrictionNotes: restrictionNotes ?? '',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await this.prisma.examRequest.update({
      where: { id: examRequestId },
      data: { status: 'CONCLUIDO' },
    });

    try {
      await this.financialService.generateExamTransactions(examRequestId);
      this.logger.log(
        `Transações financeiras geradas para ASO ${examRequestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao gerar transações financeiras para ASO ${examRequestId}`,
        error,
      );
    }

    const patientUser = await this.prisma.userAccount.findUnique({
      where: { id: request.patient.userId },
    });
    if (patientUser?.email && !patientUser.email.endsWith('@walkin.temp')) {
      try {
        await this.mailService.sendAsoReady(
          patientUser.email,
          request.patient.name,
          pdfUrl,
        );
      } catch (error) {
        this.logger.error(
          `Falha ao enviar ASO para ${patientUser.email}`,
          error,
        );
      }
    }

    this.logger.log(`ASO PDF gerado: ${pdfPath}`);
    return { pdfUrl, asoDocumentId: asoDoc.id };
  }
}
