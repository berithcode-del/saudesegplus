import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Configuração global ────────────────────────────────────────────────────

  async getConfig() {
    let config = await this.prisma.financialConfig.findFirst();
    if (!config) {
      config = await this.prisma.financialConfig.create({
        data: { defaultClinicFeePercent: 30, defaultDoctorFeePercent: 40, defaultPlatformFeePercent: 30 },
      });
    }
    return config;
  }

  async updateConfig(data: { defaultClinicFeePercent?: number; defaultDoctorFeePercent?: number; defaultPlatformFeePercent?: number }) {
    const config = await this.getConfig();
    return this.prisma.financialConfig.update({ where: { id: config.id }, data });
  }

  // ── Preços de serviço ─────────────────────────────────────────────────────

  async listServicePrices() {
    return this.prisma.servicePrice.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createServicePrice(data: { name: string; description?: string; basePrice: number; clinicFeePercent: number; doctorFeePercent: number; platformFeePercent: number }) {
    return this.prisma.servicePrice.create({ data });
  }

  async updateServicePrice(id: string, data: Partial<{ name: string; description: string; basePrice: number; clinicFeePercent: number; doctorFeePercent: number; platformFeePercent: number; isActive: boolean }>) {
    return this.prisma.servicePrice.update({ where: { id }, data });
  }

  async deleteServicePrice(id: string) {
    return this.prisma.servicePrice.delete({ where: { id } });
  }

  // ── Transações ─────────────────────────────────────────────────────────────

  async listTransactions(filters: { type?: string; category?: string; status?: string; clinicId?: string; doctorId?: string; companyId?: string; month?: number; year?: number }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.clinicId) where.clinicId = filters.clinicId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.companyId) where.companyId = filters.companyId;

    if (filters.month !== undefined && filters.year !== undefined) {
      const start = new Date(filters.year, filters.month, 1);
      const end = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
      where.transactionDate = { gte: start, lte: end };
    }

    return this.prisma.financialTransaction.findMany({
      where,
      include: {
        clinic: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        company: { select: { id: true, razaoSocial: true, nomeFantasia: true } },
        examRequest: { select: { id: true, examPurpose: true } },
        servicePrice: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async resolveClinicId(role: string, profileId?: string | null) {
    if (!profileId) return null;
    if (role === 'CLINIC') return profileId;
    if (role !== 'OPERATOR') return null;

    const operator = await this.prisma.operator.findUnique({
      where: { id: profileId },
      select: { clinicId: true },
    });
    return operator?.clinicId ?? null;
  }

  async createTransaction(data: {
    type: 'RECEITA' | 'DESPESA' | 'REPASSE';
    category: 'EXAME_ASO' | 'HONORARIO_MEDICO' | 'TAXA_CLINICA' | 'CUSTO_OPERACIONAL' | 'OUTROS';
    description: string;
    amount: number;
    method?: string;
    notes?: string;
    examRequestId?: string;
    clinicId?: string;
    doctorId?: string;
    companyId?: string;
    servicePriceId?: string;
    transactionDate?: Date;
  }) {
    return this.prisma.financialTransaction.create({ data });
  }

  async markAsPaid(id: string) {
    return this.prisma.financialTransaction.update({
      where: { id },
      data: { status: 'PAGO', paidAt: new Date() },
    });
  }

  async getSummary(month?: number, year?: number) {
    const where: any = {};
    if (month !== undefined && year !== undefined) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      where.transactionDate = { gte: start, lte: end };
    }

    const transactions = await this.prisma.financialTransaction.findMany({ where });

    const receita = transactions.filter(t => t.type === 'RECEITA').reduce((sum, t) => sum + t.amount, 0);
    const despesas = transactions.filter(t => t.type === 'DESPESA').reduce((sum, t) => sum + t.amount, 0);
    const repasseClinica = transactions.filter(t => t.type === 'REPASSE' && t.category === 'TAXA_CLINICA').reduce((sum, t) => sum + t.amount, 0);
    const repasseMedico = transactions.filter(t => t.type === 'REPASSE' && t.category === 'HONORARIO_MEDICO').reduce((sum, t) => sum + t.amount, 0);
    const totalRepasses = repasseClinica + repasseMedico;
    const lucroLiquido = receita - despesas - totalRepasses;

    const pendentesClinica = transactions.filter(t => t.category === 'TAXA_CLINICA' && t.status === 'PENDENTE').reduce((sum, t) => sum + t.amount, 0);
    const pendentesMedico = transactions.filter(t => t.category === 'HONORARIO_MEDICO' && t.status === 'PENDENTE').reduce((sum, t) => sum + t.amount, 0);

    return { receita, despesas, repasseClinica, repasseMedico, totalRepasses, lucroLiquido, pendentesClinica, pendentesMedico, totalTransactions: transactions.length };
  }

  // ── Geração automática ao emitir ASO ─────────────────────────────────────

  async generateExamTransactions(examRequestId: string) {
    const examRequest = await this.prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: {
        clinic: true,
        invite: { include: { company: true } },
        asoDocuments: { include: { doctor: true }, take: 1 },
      },
    });

    if (!examRequest) throw new NotFoundException('ExamRequest não encontrado');

    // Busca preço padrão para o tipo de exame ou cria um genérico
    let servicePrice = await this.prisma.servicePrice.findFirst({
      where: { isActive: true },
    });

    if (!servicePrice) {
      const config = await this.getConfig();
      servicePrice = await this.prisma.servicePrice.create({
        data: {
          name: 'Exame Ocupacional Padrão',
          basePrice: 250.0,
          clinicFeePercent: config.defaultClinicFeePercent,
          doctorFeePercent: config.defaultDoctorFeePercent,
          platformFeePercent: config.defaultPlatformFeePercent,
        },
      });
    }

    const basePrice = servicePrice.basePrice;
    const clinicAmount = (basePrice * servicePrice.clinicFeePercent) / 100;
    const doctorAmount = (basePrice * servicePrice.doctorFeePercent) / 100;
    const doctor = examRequest.asoDocuments[0]?.doctor;
    const company = examRequest.invite?.company;

    // 1. RECEITA: empresa pagou à plataforma
    await this.createTransaction({
      type: 'RECEITA',
      category: 'EXAME_ASO',
      description: `Exame ${examRequest.examPurpose} — ${examRequest.invite?.company?.razaoSocial ?? 'Walk-in'}`,
      amount: basePrice,
      companyId: company?.id,
      clinicId: examRequest.clinicId ?? undefined,
      examRequestId,
      servicePriceId: servicePrice.id,
    });

    // 2. REPASSE: clínica (taxa de coleta)
    if (examRequest.clinicId && clinicAmount > 0) {
      await this.createTransaction({
        type: 'REPASSE',
        category: 'TAXA_CLINICA',
        description: `Repasse clínica — Exame ${examRequest.examPurpose}`,
        amount: clinicAmount,
        clinicId: examRequest.clinicId,
        examRequestId,
        servicePriceId: servicePrice.id,
      });
    }

    // 3. REPASSE: médico (honorário)
    if (doctor?.id && doctorAmount > 0) {
      await this.createTransaction({
        type: 'REPASSE',
        category: 'HONORARIO_MEDICO',
        description: `Honorário médico — Exame ${examRequest.examPurpose}`,
        amount: doctorAmount,
        doctorId: doctor.id,
        examRequestId,
        servicePriceId: servicePrice.id,
      });
    }

    return { success: true, basePrice, clinicAmount, doctorAmount };
  }
}
