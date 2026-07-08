import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Companies ──────────────────────────────────────────────────────────────

  async getCompanies(status?: string) {
    return this.prisma.company.findMany({
      where: status ? { status: status as any } : undefined,
      include: { clinic: true, admins: { include: { user: { select: { id: true, email: true, role: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        clinic: true,
        admins: { include: { user: { select: { id: true, email: true, role: true } } } },
        patients: { include: { patient: true } },
        examInvites: { orderBy: { createdAt: 'desc' }, take: 20 },
        documents: true,
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  async updateCompany(id: string, data: any) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async deleteCompany(id: string) {
    // Cascade deletes in order of FK dependency
    const company = await this.prisma.company.findUnique({ where: { id }, include: { admins: true } });
    if (!company) throw new NotFoundException('Empresa não encontrada');

    await this.prisma.examTimelineEvent.deleteMany({ where: { invite: { companyId: id } } });
    await this.prisma.examInvite.deleteMany({ where: { companyId: id } });
    await this.prisma.companyDocument.deleteMany({ where: { companyId: id } });
    await this.prisma.companyPatientRelation.deleteMany({ where: { companyId: id } });
    await this.prisma.calendarEvent.deleteMany({ where: { companyId: id } });
    await this.prisma.financialTransaction.deleteMany({ where: { companyId: id } });

    const adminUserIds = company.admins.map((a) => a.userId);
    await this.prisma.companyAdmin.deleteMany({ where: { companyId: id } });
    await this.prisma.company.delete({ where: { id } });

    if (adminUserIds.length > 0) {
      await this.prisma.userAccount.deleteMany({ where: { id: { in: adminUserIds } } });
    }

    return { success: true };
  }

  // ─── Clinics ─────────────────────────────────────────────────────────────

  async getClinics() {
    return this.prisma.clinic.findMany({
      include: { companies: true, operators: { include: { user: { select: { id: true, email: true, role: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async getClinicById(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        companies: true,
        operators: { include: { user: { select: { id: true, email: true, role: true } } } },
        examRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');
    return clinic;
  }

  async createClinic(data: { name: string; cnpj: string; city?: string; state?: string; address?: string; email?: string }) {
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const email = data.email ?? `clinica.${data.cnpj.replace(/\D/g, '').slice(0, 8)}@saudeseg.com`;
    
    // Check if the email already exists
    const existingUser = await this.prisma.userAccount.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const user = await this.prisma.userAccount.create({
      data: {
        email,
        passwordHash,
        role: 'CLINIC',
        clinicProfile: {
          create: {
            name: data.name,
            cnpj: data.cnpj,
            city: data.city ?? null,
            state: data.state ?? null,
            address: data.address ?? null,
          },
        },
      },
      include: { clinicProfile: true },
    });

    return { ...user.clinicProfile, email: user.email, tempPassword };
  }

  async updateClinic(id: string, data: any) {
    return this.prisma.clinic.update({ where: { id }, data });
  }

  async deleteClinic(id: string) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id }, include: { operators: true } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    await this.prisma.calendarEvent.deleteMany({ where: { clinicId: id } });
    await this.prisma.financialTransaction.deleteMany({ where: { clinicId: id } });
    const operatorUserIds = clinic.operators.map((o) => o.userId);
    await this.prisma.operator.deleteMany({ where: { clinicId: id } });
    const clinicUserId = clinic.userId;
    await this.prisma.clinic.delete({ where: { id } });

    if (operatorUserIds.length > 0) {
      await this.prisma.userAccount.deleteMany({ where: { id: { in: operatorUserIds } } });
    }
    if (clinicUserId) {
      await this.prisma.userAccount.delete({ where: { id: clinicUserId } });
    }

    return { success: true };
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────

  private slugifyName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, '') // remove caracteres especiais
      .trim()
      .replace(/\s+/g, '.'); // espaços viram pontos
  }

  async getDoctors() {
    return this.prisma.doctor.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true } },
        teleconsultations: { orderBy: { startedAt: 'desc' }, take: 10 },
        asoDocuments: { orderBy: { signedAt: 'desc' }, take: 10 },
      },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    return doctor;
  }

  async createDoctor(data: {
    name: string;
    crmNumber: string;
    crmState: string;
    city?: string;
    state?: string;
    specialties?: string;
    email?: string;
  }) {
    const existing = await this.prisma.doctor.findUnique({ where: { crmNumber: data.crmNumber } });
    if (existing) throw new ConflictException('CRM já cadastrado');

    const email = data.email ?? `${this.slugifyName(data.name)}@saudeseg.com`;
    
    // Check if the email already exists
    const existingUser = await this.prisma.userAccount.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Use bcrypt for a random temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.userAccount.create({
      data: {
        email,
        passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            name: data.name,
            crmNumber: data.crmNumber,
            crmState: data.crmState,
            city: data.city ?? null,
            state: data.state ?? null,
            specialties: data.specialties ?? null,
          },
        },
      },
      include: { doctorProfile: true },
    });

    return { ...user.doctorProfile, email, tempPassword };
  }

  async updateDoctor(id: string, data: any) {
    return this.prisma.doctor.update({ where: { id }, data });
  }

  async verifyDoctor(doctorId: string) {
    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: { verifiedAt: new Date() },
    });
  }

  async deleteDoctor(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    await this.prisma.asoDocument.deleteMany({ where: { doctorId: id } });
    await this.prisma.teleconsultation.deleteMany({ where: { doctorId: id } });
    await this.prisma.calendarEvent.deleteMany({ where: { doctorId: id } });
    await this.prisma.financialTransaction.deleteMany({ where: { doctorId: id } });
    await this.prisma.doctor.delete({ where: { id } });
    await this.prisma.userAccount.delete({ where: { id: doctor.userId } });

    return { success: true };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  async getStats() {
    const [companies, patients, examRequests, asos, financial] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.patient.count(),
      this.prisma.examRequest.count(),
      this.prisma.asoDocument.count(),
      this.prisma.financialTransaction.groupBy({
        by: ['type', 'status'],
        _sum: { amount: true },
      }),
    ]);

    let receita = 0;
    let repasses = 0;
    let pendente = 0;
    let despesas = 0;

    for (const f of financial) {
      const val = f._sum.amount || 0;
      if (f.type === 'RECEITA' && f.status === 'PAGO') receita += val;
      if (f.type === 'REPASSE' && f.status === 'PAGO') repasses += val;
      if (f.type === 'DESPESA' && f.status === 'PAGO') despesas += val;
      if (f.type === 'RECEITA' && f.status === 'PENDENTE') pendente += val;
    }

    return {
      totalCompanies: companies,
      totalPatients: patients,
      totalSolicitacoes: examRequests,
      totalAsoEmitidos: asos,
      financial: {
        receita,
        repasses,
        pendente,
        lucro: receita - repasses - despesas,
      }
    };
  }

  // ─── Document Approval ─────────────────────────────────────────────────────

  async approveCompanyDocumentation(companyId: string, approvedBy: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        status: true,
        pcmsoValidUntil: true,
        ppraValidUntil: true,
        razaoSocial: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const now = new Date();
    const pcmsoValid = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
    const ppraValid = company.ppraValidUntil && company.ppraValidUntil > now;

    if (!pcmsoValid || !ppraValid) {
      throw new BadRequestException(
        `Documentação incompleta. PCMSO válido: ${pcmsoValid ? 'sim' : 'não'}, PPRA válido: ${ppraValid ? 'sim' : 'não'}`
      );
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        status: 'LIBERADA',
        updatedAt: now,
      },
    });

    return {
      success: true,
      message: `Empresa ${company.razaoSocial} aprovada e liberada para operação.`,
      companyId: company.id,
      approvedAt: now,
      approvedBy,
    };
  }

  async getCompaniesPendingApproval() {
    return this.prisma.company.findMany({
      where: {
        status: { in: ['CADASTRO_INCOMPLETO', 'EM_ANALISE'] },
      },
      include: {
        documents: {
          where: {
            type: { in: ['PCMSO', 'PPRA'] },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        admins: { include: { user: { select: { id: true, email: true, role: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
