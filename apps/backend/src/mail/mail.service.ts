import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendInviteLink(to: string, empresa: string, link: string, expiresAt: Date) {
    const html = `
      <h2>Convite para Exame Ocupacional</h2>
      <p>Você foi convidado por <strong>${empresa}</strong> para realizar seu exame ocupacional.</p>
      <p>Acesse o link abaixo para iniciar seu processo:</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#3b6ff5;color:#fff;text-decoration:none;border-radius:6px">Acessar Portal</a></p>
      <p>Este link expira em <strong>${expiresAt.toLocaleDateString('pt-BR')}</strong>.</p>
      <hr><p style="color:#888;font-size:12px">Plataforma SaúdeSeg+</p>
    `;
    await this.mailerService.sendMail({ to, subject: `Convite - Exame Ocupacional - ${empresa}`, html });
  }

  async sendAsoReady(to: string, patientName: string, pdfUrl: string) {
    const html = `
      <h2>ASO Disponível</h2>
      <p>Olá <strong>${patientName}</strong>, seu Atestado de Saúde Ocupacional está pronto.</p>
      <p><a href="${pdfUrl}" style="display:inline-block;padding:12px 24px;background:#38a169;color:#fff;text-decoration:none;border-radius:6px">Baixar ASO</a></p>
      <hr><p style="color:#888;font-size:12px">Plataforma SaúdeSeg+</p>
    `;
    await this.mailerService.sendMail({ to, subject: 'Seu ASO está disponível', html });
  }

  async sendAsoExpirationAlert(
    to: string,
    empresa: string,
    asos: Array<{ patientName: string; examType: string; validUntil: Date; daysUntilExpiration: number }>,
  ) {
    const rows = asos.map((aso) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${aso.patientName}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${aso.examType}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${aso.validUntil.toLocaleDateString('pt-BR')}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${aso.daysUntilExpiration} dias</td>
      </tr>
    `).join('');

    const html = `
      <h2>ASOs perto do vencimento</h2>
      <p>A empresa <strong>${empresa}</strong> possui ${asos.length} ASO(s) com vencimento proximo.</p>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #d1d5db">Colaborador</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #d1d5db">Tipo</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #d1d5db">Validade</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #d1d5db">Prazo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <hr><p style="color:#888;font-size:12px">Plataforma SaudeSeg+</p>
    `;
    await this.mailerService.sendMail({ to, subject: `ASOs perto do vencimento - ${empresa}`, html });
  }
}
