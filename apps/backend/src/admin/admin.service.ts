import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { CompanyStatus, DataEnvironment, Prisma } from '@prisma/client';
import {
  UpdateAdminClinicDto,
  UpdateAdminCompanyDto,
  UpdateAdminDoctorDto,
  SetMatrizClinicDto,
} from './dto/update-admin-profiles.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private normalizeGender(gender?: string | null): 'male' | 'female' | null {
    if (gender === 'male' || gender === 'female') return gender;
    return null;
  }

  // ─── Companies ──────────────────────────────────────────────────────────────

  async getCompanies(
    status?: CompanyStatus,
    environment: DataEnvironment = DataEnvironment.REAL,
  ) {
    return this.prisma.company.findMany({
      where: {
        environment,
        ...(status ? { status } : {}),
      },
      include: {
        clinic: true,
        admins: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        clinic: true,
        admins: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        patients: { include: { patient: true } },
        examInvites: { orderBy: { createdAt: 'desc' }, take: 20 },
        documents: true,
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return {
      ...company,
      accessEmail: company.admins[0]?.user.email ?? null,
    };
  }

  async createCompany(data: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj: string;
    address?: string;
    cep?: string;
    city?: string;
    state?: string;
    email?: string;
    environment?: DataEnvironment;
  }) {
    const environment = data.environment ?? DataEnvironment.REAL;
    const normalizedCnpj = data.cnpj.replace(/\D/g, '');
    const email =
      data.email?.trim().toLowerCase() ??
      `${environment === DataEnvironment.SANDBOX ? 'sandbox.' : ''}empresa.${normalizedCnpj.slice(0, 8)}@saudeseg.com`;
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [existingCompany, existingUser] = await Promise.all([
          tx.company.findUnique({ where: { cnpj: normalizedCnpj } }),
          tx.userAccount.findUnique({ where: { email } }),
        ]);
        if (existingCompany) throw new ConflictException('CNPJ já cadastrado');
        if (existingUser) throw new ConflictException('E-mail já cadastrado');

        const company = await tx.company.create({
          data: {
            cnpj: normalizedCnpj,
            razaoSocial: data.razaoSocial.trim(),
            nomeFantasia: data.nomeFantasia?.trim() || null,
            address: data.address?.trim() || null,
            cep: data.cep?.replace(/\D/g, '') || null,
            city: data.city?.trim() || null,
            state: data.state?.trim().toUpperCase() || null,
            contactEmail: email,
            environment,
            status:
              environment === DataEnvironment.SANDBOX
                ? CompanyStatus.LIBERADA
                : CompanyStatus.CADASTRO_INCOMPLETO,
            ...(environment === DataEnvironment.SANDBOX
              ? {
                  pcmsoValidUntil: validUntil,
                  ppraValidUntil: validUntil,
                }
              : {}),
          },
        });
        const user = await tx.userAccount.create({
          data: {
            email,
            passwordHash,
            role: 'COMPANY_ADMIN',
          },
        });
        await tx.companyAdmin.create({
          data: { userId: user.id, companyId: company.id },
        });
        return { company, user };
      });

      return {
        ...result.company,
        email: result.user.email,
        tempPassword,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.rethrowUniqueConflict(error, 'CNPJ ou e-mail já cadastrado');
    }
  }

  async updateCompany(id: string, data: UpdateAdminCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { admins: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');

    const { accessEmail, ...profileData } = data;
    const companyData: Prisma.CompanyUpdateInput = {
      ...profileData,
      ...(profileData.cnpj
        ? { cnpj: profileData.cnpj.replace(/\D/g, '') }
        : {}),
      ...(profileData.contactEmail
        ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
        : {}),
      status: profileData.status,
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (accessEmail && company.admins[0]) {
          await tx.userAccount.update({
            where: { id: company.admins[0].userId },
            data: { email: accessEmail.trim().toLowerCase() },
          });
        }
        return tx.company.update({ where: { id }, data: companyData });
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'CNPJ ou e-mail já cadastrado');
    }
  }

  async deleteCompany(id: string) {
    // Cascade deletes in order of FK dependency
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { admins: true },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');

    await this.prisma.examTimelineEvent.deleteMany({
      where: { invite: { companyId: id } },
    });
    await this.prisma.examInvite.deleteMany({ where: { companyId: id } });
    await this.prisma.companyDocument.deleteMany({ where: { companyId: id } });
    await this.prisma.companyPatientRelation.deleteMany({
      where: { companyId: id },
    });
    await this.prisma.calendarEvent.deleteMany({ where: { companyId: id } });
    await this.prisma.financialTransaction.deleteMany({
      where: { companyId: id },
    });

    const adminUserIds = company.admins.map((a) => a.userId);
    await this.prisma.companyAdmin.deleteMany({ where: { companyId: id } });
    await this.prisma.company.delete({ where: { id } });

    if (adminUserIds.length > 0) {
      await this.prisma.userAccount.deleteMany({
        where: { id: { in: adminUserIds } },
      });
    }

    return { success: true };
  }

  // ─── Clinics ─────────────────────────────────────────────────────────────

  async getClinics(environment: DataEnvironment = DataEnvironment.REAL) {
    return this.prisma.clinic.findMany({
      where: { environment },
      include: {
        companies: true,
        operators: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getClinicById(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        companies: true,
        user: { select: { id: true, email: true } },
        operators: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        examRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');
    return {
      ...clinic,
      accessEmail: clinic.user?.email ?? null,
    };
  }

  async createClinic(data: {
    name: string;
    cnpj: string;
    city?: string;
    state?: string;
    address?: string;
    email?: string;
    environment?: DataEnvironment;
  }) {
    const environment = data.environment ?? DataEnvironment.REAL;
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const email =
      data.email ??
      `${environment === DataEnvironment.SANDBOX ? 'sandbox.' : ''}clinica.${data.cnpj.replace(/\D/g, '').slice(0, 8)}@saudeseg.com`;

    // Check if the email already exists
    const existingUser = await this.prisma.userAccount.findUnique({
      where: { email },
    });
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
            environment,
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

  async updateClinic(id: string, data: UpdateAdminClinicDto) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    const { accessEmail, ...profileData } = data;
    const clinicData: Prisma.ClinicUpdateInput = {
      ...profileData,
      ...(profileData.cnpj
        ? { cnpj: profileData.cnpj.replace(/\D/g, '') }
        : {}),
      ...(profileData.contactEmail
        ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
        : {}),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (accessEmail && clinic.userId) {
          await tx.userAccount.update({
            where: { id: clinic.userId },
            data: { email: accessEmail.trim().toLowerCase() },
          });
        }
        return tx.clinic.update({ where: { id }, data: clinicData });
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'CNPJ ou e-mail já cadastrado');
    }
  }

  async deleteClinic(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: { operators: true },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    await this.prisma.calendarEvent.deleteMany({ where: { clinicId: id } });
    await this.prisma.financialTransaction.deleteMany({
      where: { clinicId: id },
    });
    const operatorUserIds = clinic.operators.map((o) => o.userId);
    await this.prisma.operator.deleteMany({ where: { clinicId: id } });
    const clinicUserId = clinic.userId;
    await this.prisma.clinic.delete({ where: { id } });

    if (operatorUserIds.length > 0) {
      await this.prisma.userAccount.deleteMany({
        where: { id: { in: operatorUserIds } },
      });
    }
    if (clinicUserId) {
      await this.prisma.userAccount.delete({ where: { id: clinicUserId } });
    }

    return { success: true };
  }

  async setClinicAsMatriz(id: string, setAsMatriz: boolean) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    if (setAsMatriz) {
      // Se está definindo como matriz, desmarcar qualquer outra clínica que seja matriz no mesmo estado
      await this.prisma.clinic.updateMany({
        where: {
          isMatriz: true,
          state: clinic.state,
          environment: clinic.environment,
          NOT: { id },
        },
        data: { isMatriz: false },
      });
    }

    return this.prisma.clinic.update({
      where: { id },
      data: { isMatriz: setAsMatriz },
      include: {
        companies: true,
        operators: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
    });
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

  async getDoctors(environment: DataEnvironment = DataEnvironment.REAL) {
    return this.prisma.doctor.findMany({
      where: { environment },
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
    return {
      ...doctor,
      accessEmail: doctor.user.email,
    };
  }

  async createDoctor(data: {
    name: string;
    gender?: string;
    crmNumber: string;
    crmState: string;
    city?: string;
    state?: string;
    specialties?: string;
    email?: string;
    environment?: DataEnvironment;
  }) {
    const environment = data.environment ?? DataEnvironment.REAL;
    const existing = await this.prisma.doctor.findUnique({
      where: { crmNumber: data.crmNumber },
    });
    if (existing) throw new ConflictException('CRM já cadastrado');

    const email =
      data.email ??
      `${environment === DataEnvironment.SANDBOX ? 'sandbox.' : ''}${this.slugifyName(data.name)}@saudeseg.com`;
    const gender = this.normalizeGender(data.gender);

    // Check if the email already exists
    const existingUser = await this.prisma.userAccount.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Use bcrypt for a random temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.userAccount.create({
      data: {
        email,
        passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            name: data.name,
            environment,
            gender,
            crmNumber: data.crmNumber,
            crmState: data.crmState,
            city: data.city ?? null,
            state: data.state ?? null,
            specialties: data.specialties ?? null,
            verifiedAt:
              environment === DataEnvironment.SANDBOX ? new Date() : null,
          },
        },
      },
      include: { doctorProfile: true },
    });

    return { ...user.doctorProfile, email, tempPassword };
  }

  async updateDoctor(id: string, data: UpdateAdminDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    const { accessEmail, ...profileData } = data;
    const doctorData: Prisma.DoctorUpdateInput = {
      ...profileData,
      ...(profileData.gender !== undefined
        ? { gender: this.normalizeGender(profileData.gender) }
        : {}),
      ...(profileData.crmNumber
        ? { crmNumber: profileData.crmNumber.trim() }
        : {}),
      ...(profileData.contactEmail
        ? { contactEmail: profileData.contactEmail.trim().toLowerCase() }
        : {}),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (accessEmail) {
          await tx.userAccount.update({
            where: { id: doctor.userId },
            data: { email: accessEmail.trim().toLowerCase() },
          });
        }
        return tx.doctor.update({ where: { id }, data: doctorData });
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'CRM ou e-mail já cadastrado');
    }
  }

  private rethrowUniqueConflict(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
    throw error;
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
    await this.prisma.financialTransaction.deleteMany({
      where: { doctorId: id },
    });
    await this.prisma.doctor.delete({ where: { id } });
    await this.prisma.userAccount.delete({ where: { id: doctor.userId } });

    return { success: true };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  async getStats() {
    const [companies, patients, examRequests, asos, financial] =
      await Promise.all([
        this.prisma.company.count({
          where: { environment: DataEnvironment.REAL },
        }),
        this.prisma.patient.count({
          where: { environment: DataEnvironment.REAL },
        }),
        this.prisma.examRequest.count({
          where: { environment: DataEnvironment.REAL },
        }),
        this.prisma.asoDocument.count({
          where: { request: { environment: DataEnvironment.REAL } },
        }),
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
      },
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
        `Documentação incompleta. PCMSO válido: ${pcmsoValid ? 'sim' : 'não'}, PPRA válido: ${ppraValid ? 'sim' : 'não'}`,
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
        environment: DataEnvironment.REAL,
        status: { in: ['CADASTRO_INCOMPLETO', 'EM_ANALISE'] },
      },
      include: {
        documents: {
          where: {
            type: { in: ['PCMSO', 'PPRA'] },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        admins: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
