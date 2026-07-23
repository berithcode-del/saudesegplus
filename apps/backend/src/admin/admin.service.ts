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

  async getSandboxPatients() {
    return this.prisma.patient.findMany({
      where: { environment: DataEnvironment.SANDBOX },
      select: {
        id: true,
        name: true,
        cpf: true,
        status: true,
        createdAt: true,
        companies: {
          select: {
            company: {
              select: {
                id: true,
                razaoSocial: true,
                nomeFantasia: true,
              },
            },
          },
        },
        processoAsos: {
          select: {
            id: true,
            numeroProtocolo: true,
            status: true,
            tipoExame: true,
            dataAbertura: true,
            clinica: { select: { id: true, name: true } },
            empresa: {
              select: {
                id: true,
                razaoSocial: true,
                nomeFantasia: true,
              },
            },
          },
          orderBy: { dataAbertura: 'desc' },
        },
        examRequests: {
          select: {
            id: true,
            status: true,
            examPurpose: true,
            createdAt: true,
            clinic: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clearSandbox() {
    return this.prisma.$transaction(
      async (tx) => {
        const [
        clinics,
        doctors,
        companies,
        patients,
        examRequests,
        examInvites,
        processos,
        payments,
      ] = await Promise.all([
        tx.clinic.findMany({
          where: { environment: DataEnvironment.SANDBOX },
          select: {
            id: true,
            userId: true,
            operators: { select: { id: true, userId: true } },
          },
        }),
        tx.doctor.findMany({
          where: { environment: DataEnvironment.SANDBOX },
          select: { id: true, userId: true },
        }),
        tx.company.findMany({
          where: { environment: DataEnvironment.SANDBOX },
          select: {
            id: true,
            admins: { select: { userId: true } },
          },
        }),
        tx.patient.findMany({
          where: { environment: DataEnvironment.SANDBOX },
          select: { id: true, userId: true },
        }),
        tx.examRequest.findMany({
          where: { environment: DataEnvironment.SANDBOX },
          select: { id: true },
        }),
        tx.examInvite.findMany({
          where: { company: { environment: DataEnvironment.SANDBOX } },
          select: { id: true },
        }),
        tx.processoASO.findMany({
          where: { empresa: { environment: DataEnvironment.SANDBOX } },
          select: { id: true },
        }),
        tx.payment.findMany({
          where: {
            OR: [
              { company: { environment: DataEnvironment.SANDBOX } },
              { clinic: { environment: DataEnvironment.SANDBOX } },
            ],
          },
          select: { id: true },
        }),
      ]);

      const clinicIds = clinics.map(({ id }) => id);
      const doctorIds = doctors.map(({ id }) => id);
      const companyIds = companies.map(({ id }) => id);
      const patientIds = patients.map(({ id }) => id);
      const requestIds = examRequests.map(({ id }) => id);
      const inviteIds = examInvites.map(({ id }) => id);
      const processoIds = processos.map(({ id }) => id);
      const paymentIds = payments.map(({ id }) => id);
      const operatorIds = clinics.flatMap(({ operators }) =>
        operators.map(({ id }) => id),
      );
      const userIds = [
        ...clinics.flatMap(({ userId }) => (userId ? [userId] : [])),
        ...clinics.flatMap(({ operators }) =>
          operators.map(({ userId }) => userId),
        ),
        ...doctors.map(({ userId }) => userId),
        ...companies.flatMap(({ admins }) =>
          admins.map(({ userId }) => userId),
        ),
        ...patients.map(({ userId }) => userId),
      ];

      const crossEnvironmentReferences = await Promise.all([
        tx.company.count({
          where: {
            environment: DataEnvironment.REAL,
            clinicId: { in: clinicIds },
          },
        }),
        tx.examRequest.count({
          where: {
            environment: DataEnvironment.REAL,
            OR: [
              { clinicId: { in: clinicIds } },
              { patientId: { in: patientIds } },
            ],
          },
        }),
        tx.examInvite.count({
          where: {
            company: { environment: DataEnvironment.REAL },
            clinicId: { in: clinicIds },
          },
        }),
        tx.processoASO.count({
          where: {
            empresa: { environment: DataEnvironment.REAL },
            OR: [
              { clinicaId: { in: clinicIds } },
              { pacienteId: { in: patientIds } },
              { medicoId: { in: doctorIds } },
            ],
          },
        }),
        tx.clinic.count({
          where: {
            environment: DataEnvironment.REAL,
            parentClinicId: { in: clinicIds },
          },
        }),
      ]);
      if (crossEnvironmentReferences.some((count) => count > 0)) {
        throw new BadRequestException(
          'A limpeza foi bloqueada porque existe um vínculo inválido entre dados reais e Sandbox.',
        );
      }

      await tx.examTimelineEvent.deleteMany({
        where: {
          OR: [
            { examRequestId: { in: requestIds } },
            { inviteId: { in: inviteIds } },
          ],
        },
      });
      await tx.asoDocument.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await tx.patientDocument.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await tx.queueEntry.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await tx.teleconsultation.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await tx.examResult.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await tx.financialTransaction.deleteMany({
        where: {
          OR: [
            { examRequestId: { in: requestIds } },
            { clinicId: { in: clinicIds } },
            { doctorId: { in: doctorIds } },
            { companyId: { in: companyIds } },
            { paymentId: { in: paymentIds } },
          ],
        },
      });

      await tx.examRequest.updateMany({
        where: { id: { in: requestIds } },
        data: { processoAsoId: null, inviteId: null, paymentId: null },
      });
      await tx.examInvite.updateMany({
        where: { id: { in: inviteIds } },
        data: { processoAsoId: null, clinicId: null, paymentId: null },
      });
      await tx.processoASO.updateMany({
        where: { id: { in: processoIds } },
        data: {
          examRequestId: null,
          inviteId: null,
          pacienteId: null,
          clinicaId: null,
          medicoId: null,
        },
      });

      const deletedProtocols = await tx.processoASO.deleteMany({
        where: { id: { in: processoIds } },
      });
      const deletedExamRequests = await tx.examRequest.deleteMany({
        where: { id: { in: requestIds } },
      });
      const deletedInvites = await tx.examInvite.deleteMany({
        where: { id: { in: inviteIds } },
      });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });

      await tx.anamnese.deleteMany({
        where: { patientId: { in: patientIds } },
      });
      await tx.companyPatientRelation.deleteMany({
        where: {
          AND: [
            { patientId: { in: patientIds } },
            { companyId: { in: companyIds } },
          ],
        },
      });
      await tx.companyDocument.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.calendarEvent.deleteMany({
        where: {
          OR: [
            { clinicId: { in: clinicIds } },
            { doctorId: { in: doctorIds } },
            { companyId: { in: companyIds } },
          ],
        },
      });
      await tx.clinicAuditEvent.deleteMany({
        where: { clinicId: { in: clinicIds } },
      });
      await tx.clinicActorSession.deleteMany({
        where: { clinicId: { in: clinicIds } },
      });
      await tx.clinicDoctor.deleteMany({
        where: {
          OR: [
            { clinicId: { in: clinicIds } },
            { doctorId: { in: doctorIds } },
          ],
        },
      });
      await tx.doctorCertificate.deleteMany({
        where: { doctorId: { in: doctorIds } },
      });
      await tx.signatureAudit.deleteMany({
        where: { doctorId: { in: doctorIds } },
      });
      await tx.operator.deleteMany({
        where: { id: { in: operatorIds } },
      });
      await tx.companyAdmin.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      await tx.supportTicket.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.notification.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.operatorMessage.deleteMany({
        where: { authorId: { in: userIds } },
      });
      await tx.operatorConversationParticipant.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.operatorConversation.deleteMany({
        where: { participants: { none: {} } },
      });

      const deletedPatients = await tx.patient.deleteMany({
        where: { id: { in: patientIds } },
      });
      const deletedDoctors = await tx.doctor.deleteMany({
        where: { id: { in: doctorIds } },
      });
      const deletedCompanies = await tx.company.deleteMany({
        where: { id: { in: companyIds } },
      });
      await tx.clinic.updateMany({
        where: { id: { in: clinicIds } },
        data: { parentClinicId: null },
      });
      const deletedClinics = await tx.clinic.deleteMany({
        where: { id: { in: clinicIds } },
      });
      await tx.userAccount.deleteMany({
        where: {
          id: { in: userIds },
          role: { not: 'ADMIN' },
        },
      });

        return {
          success: true,
          deleted: {
            clinics: deletedClinics.count,
            doctors: deletedDoctors.count,
            companies: deletedCompanies.count,
            patients: deletedPatients.count,
            examRequests: deletedExamRequests.count,
            protocols: deletedProtocols.count,
            invites: deletedInvites.count,
          },
        };
      },
      {
        maxWait: 10_000,
        timeout: 60_000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
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
    if (environment !== DataEnvironment.SANDBOX) {
      throw new BadRequestException(
        'Empresas reais devem ser criadas pelo fluxo de inscrição.',
      );
    }

    const normalizedCnpj = data.cnpj.replace(/\D/g, '');
    const razaoSocial = data.razaoSocial.trim();
    if (!razaoSocial || normalizedCnpj.length !== 14) {
      throw new BadRequestException('Dados obrigatórios da empresa inválidos.');
    }

    const email =
      data.email?.trim().toLowerCase() ??
      `sandbox.empresa.${normalizedCnpj.slice(0, 8)}@saudeseg.com`;
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
            razaoSocial,
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
    const name = data.name.trim();
    const cnpj = data.cnpj.replace(/\D/g, '');
    if (!name || cnpj.length !== 14) {
      throw new BadRequestException('Dados obrigatórios da clínica inválidos.');
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const email =
      data.email?.trim().toLowerCase() ??
      `${environment === DataEnvironment.SANDBOX ? 'sandbox.' : ''}clinica.${cnpj.slice(0, 8)}@saudeseg.com`;

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
            name,
            cnpj,
            environment,
            city: data.city?.trim() || null,
            state: data.state?.trim().toUpperCase() || null,
            address: data.address?.trim() || null,
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
    const name = data.name.trim();
    const crmNumber = data.crmNumber.trim();
    const crmState = data.crmState.trim().toUpperCase();
    if (!name || !crmNumber || !/^[A-Z]{2}$/.test(crmState)) {
      throw new BadRequestException('Dados obrigatórios do médico inválidos.');
    }

    const existing = await this.prisma.doctor.findUnique({
      where: { crmNumber },
    });
    if (existing) throw new ConflictException('CRM já cadastrado');

    const email =
      data.email?.trim().toLowerCase() ??
      `${environment === DataEnvironment.SANDBOX ? 'sandbox.' : ''}${this.slugifyName(name)}@saudeseg.com`;
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
            name,
            environment,
            gender,
            crmNumber,
            crmState,
            city: data.city?.trim() || null,
            state: data.state?.trim().toUpperCase() || null,
            specialties: data.specialties?.trim() || null,
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
