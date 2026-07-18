"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let MailService = class MailService {
    mailerService;
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendInviteLink(to, empresa, link, expiresAt) {
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
    async sendAsoReady(to, patientName, pdfUrl) {
        const html = `
      <h2>ASO Disponível</h2>
      <p>Olá <strong>${patientName}</strong>, seu Atestado de Saúde Ocupacional está pronto.</p>
      <p><a href="${pdfUrl}" style="display:inline-block;padding:12px 24px;background:#38a169;color:#fff;text-decoration:none;border-radius:6px">Baixar ASO</a></p>
      <hr><p style="color:#888;font-size:12px">Plataforma SaúdeSeg+</p>
    `;
        await this.mailerService.sendMail({ to, subject: 'Seu ASO está disponível', html });
    }
    async sendAsoExpirationAlert(to, empresa, asos) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
//# sourceMappingURL=mail.service.js.map