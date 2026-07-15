import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CompanyGateway } from './company.gateway';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private companyGateway: CompanyGateway,
    private mailService: MailService,
  ) {}

  async createCompany(dto: CreateCompanyDto) {
    const email = dto.contactEmail.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password ?? randomUUID(), 12);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingCompany = await tx.company.findUnique({
          where: { cnpj: dto.cnpj },
          include: { admins: true },
        });
        const existingUser = await tx.userAccount.findUnique({
          where: { email },
          include: { companyAdminProfile: true },
        });

        if (existingCompany?.admins.length) {
          throw new ConflictException('CNPJ ja cadastrado');
        }

        if (existingUser?.companyAdminProfile) {
          throw new ConflictException('E-mail ja cadastrado');
        }

        if (existingUser && existingUser.role !== 'COMPANY_ADMIN') {
          throw new ConflictException('E-mail ja cadastrado em outro perfil');
        }

        const company = existingCompany
          ? await tx.company.update({
              where: { id: existingCompany.id },
              data: {
                razaoSocial: dto.razaoSocial,
                nomeFantasia: dto.nomeFantasia,
                contactEmail: email,
                address: dto.address,
                cep: dto.cep,
                city: dto.city,
                state: dto.state,
                lat: dto.lat,
                lng: dto.lng,
              },
            })
          : await tx.company.create({
              data: {
                cnpj: dto.cnpj,
                razaoSocial: dto.razaoSocial,
                nomeFantasia: dto.nomeFantasia,
                contactEmail: email,
                address: dto.address,
                cep: dto.cep,
                city: dto.city,
                state: dto.state,
                lat: dto.lat,
                lng: dto.lng,
                status: 'CADASTRO_INCOMPLETO',
              },
            });

        const user = existingUser
          ? await tx.userAccount.update({
              where: { id: existingUser.id },
              data: { passwordHash, role: 'COMPANY_ADMIN' },
            })
          : await tx.userAccount.create({
              data: {
                email,
                passwordHash,
                role: 'COMPANY_ADMIN',
              },
            });

        await tx.companyAdmin.create({
          data: {
            userId: user.id,
            companyId: company.id,
          },
        });

        const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
        return { company, user: userWithoutPassword };
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('CNPJ ou e-mail ja cadastrado');
      }
      throw error;
    }
  }

  async getCompany(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: { admins: true, clinic: true },
    });
  }

  async listCompanies() {
    return this.prisma.company.findMany({
      include: { clinic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
      const data: Record<string, string> = {};
      if (dto.nomeFantasia !== undefined) data.nomeFantasia = dto.nomeFantasia;
      if (dto.address !== undefined) data.address = dto.address;
      if (dto.cep !== undefined) data.cep = dto.cep;
      if (dto.city !== undefined) data.city = dto.city;
      if (dto.state !== undefined) data.state = dto.state;
      if (dto.phone !== undefined) data.phone = dto.phone;
      if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
      if (dto.clinicId !== undefined) data.clinicId = dto.clinicId;
      return this.prisma.company.update({
        where: { id: companyId },
        data,
      });
    }

  async updateCompanyStatus(companyId: string, status: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { status: status as any },
    });
  }

  async createInvite(companyId: string, dto: CreateInviteDto) {
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
      throw new Error('Empresa não encontrada');
    }

    const now = new Date();
    const pcmsoValid = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
    const ppraValid = company.ppraValidUntil && company.ppraValidUntil > now;

    if (company.status !== 'LIBERADA') {
      throw new Error(
        `Empresa com status '${company.status}'. É necessário ter documentação PCMSO e PPRA válidas para criar convites.`,
      );
    }

    if (!pcmsoValid || !ppraValid) {
      throw new Error(
        'Documentação PCMSO ou PPRA vencida. Por favor, renove os documentos antes de criar novos convites.',
      );
    }

    const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays ?? 7));

        // Determine clinic: use provided clinicId, or find best clinic for company
        let clinicId = dto.clinicId;
        if (!clinicId) {
          const bestClinic = await this.findBestClinicForCompany(companyId);
          if (bestClinic) clinicId = bestClinic.id;
        }

        const invite = await this.prisma.examInvite.create({
              data: {
                companyId,
                clinicId,
                collaboratorName: dto.collaboratorName,
                expectedCpf: dto.expectedCpf?.replace(/\D/g, '') ?? null,
                expectedEmail: dto.expectedEmail,
                expectedBirthDate: dto.expectedBirthDate
                  ? new Date(dto.expectedBirthDate)
                  : null,
                roleFunction: dto.roleFunction,
                roleFunctionCboCode: dto.roleFunctionCboCode,
                examType: dto.examType,
                expiresAt,
                status: 'ENVIADO',
              },
              include: { company: true },
            });

    await this.prisma.examTimelineEvent.create({
      data: {
        inviteId: invite.id,
        eventType: 'LINK_ENVIADO',
      },
    });

    // Antes este evento era apenas persistido — nada era emitido pelo
    // CompanyGateway, então o painel da empresa só via o convite após
    // um refresh manual da página.
    this.companyGateway.emitTimelineUpdate(companyId, {
      inviteId: invite.id,
      eventType: 'LINK_ENVIADO',
      occurredAt: invite.sentAt.toISOString(),
    });

    if (dto.expectedEmail) {
      const link = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/p/${invite.token}`;
      try {
        await this.mailService.sendInviteLink(
          dto.expectedEmail,
          invite.company.razaoSocial ?? '',
          link,
          invite.expiresAt,
        );
      } catch (err) {
        console.error(
          `[Mail] Falha ao enviar e-mail para ${dto.expectedEmail}:`,
          err,
        );
      }
    }

    return invite;
  }

  async listInvites(companyId: string) {
    return this.prisma.examInvite.findMany({
      where: { companyId },
      include: {
        timelineEvents: { orderBy: { occurredAt: 'asc' } },
        examRequest: { include: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listActiveAsos(companyId: string) {
    const now = new Date();
    const asos = await this.prisma.asoDocument.findMany({
      where: {
        validUntil: { gte: now },
        request: {
          patient: {
            companies: {
              some: {
                companyId,
                OR: [{ endDate: null }, { endDate: { gte: now } }],
              },
            },
          },
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

  async cancelInvite(inviteId: string) {
    return this.prisma.examInvite.delete({
      where: { id: inviteId },
    });
  }

  async findInviteByCpf(
    cpf: string,
    user: { role: string; profileId?: string | null },
  ) {
    let clinicId = user.role === 'CLINIC' ? user.profileId : undefined;
    if (user.role === 'OPERATOR') {
      const operator = await this.prisma.operator.findUnique({
        where: { id: user.profileId ?? '' },
        select: { clinicId: true },
      });
      clinicId = operator?.clinicId;
    }
    if (user.role !== 'ADMIN' && !clinicId) {
      throw new ForbiddenException('Clinica nao identificada');
    }
    return this.prisma.examInvite.findFirst({
      where: {
        expectedCpf: cpf,
        status: { in: ['ENVIADO', 'ABERTO'] },
        ...(user.role === 'ADMIN' ? {} : { company: { clinicId } }),
      },
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    });
  }

  async getInviteTimeline(inviteId: string) {
    const invite = await this.prisma.examInvite.findUnique({
      where: { id: inviteId },
      include: {
        timelineEvents: { orderBy: { occurredAt: 'asc' } },
        examRequest: {
          include: { asoDocuments: true },
        },
      },
    });

    if (!invite) throw new Error('Invite not found');

    return {
      invite,
      timeline: invite.timelineEvents,
      finalResult: invite.examRequest?.asoDocuments?.[0]?.decision ?? null,
    };
  }

  async recordTimelineEvent(data: {
    inviteId?: string;
    examRequestId?: string;
    eventType: string;
  }) {
    return this.prisma.examTimelineEvent.create({
      data: {
        inviteId: data.inviteId,
        examRequestId: data.examRequestId,
        eventType: data.eventType as any,
      },
    });
  }

  async getDashboardStats(companyId: string) {
    const invites = await this.prisma.examInvite.findMany({
      where: { companyId },
      include: { examRequest: true },
    });

    const total = invites.length;
    const sent = invites.filter((i) => i.status === 'ENVIADO').length;
    const opened = invites.filter((i) => i.status === 'ABERTO').length;
    const inProgress = invites.filter(
      (i) => i.examRequest && i.examRequest.status !== 'CONCLUIDO',
    ).length;
    const completed = invites.filter(
      (i) => i.examRequest?.status === 'CONCLUIDO',
    ).length;
    const expired = invites.filter(
      (i) => i.status === 'EXPIRADO' || new Date() > i.expiresAt,
    ).length;

    return { total, sent, opened, inProgress, completed, expired };
  }

  async getStatusCheck(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        razaoSocial: true,
        status: true,
        pcmsoDocumentUrl: true,
        ppraDocumentUrl: true,
        pcmsoValidUntil: true,
        ppraValidUntil: true,
        clinicId: true,
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });
    if (!company) throw new Error('Empresa não encontrada');

    const now = new Date();

    return {
      hasRazaoSocial: !!company.razaoSocial,
      hasPcmso: !!company.pcmsoDocumentUrl,
      hasPpra: !!company.ppraDocumentUrl,
      pcmsoValid: !!company.pcmsoValidUntil && company.pcmsoValidUntil > now,
      ppraValid: !!company.ppraValidUntil && company.ppraValidUntil > now,
      hasClinicAssigned: !!company.clinicId,
      clinic: company.clinic
        ? {
            id: company.clinic.id,
            name: company.clinic.name,
            address: company.clinic.address,
            city: company.clinic.city,
            state: company.clinic.state,
          }
        : null,
      status: company.status,
      isComplete:
        !!company.pcmsoValidUntil &&
        company.pcmsoValidUntil > now &&
        !!company.ppraValidUntil &&
        company.ppraValidUntil > now,
    };
  }

  async listInvitesForAllCompanies() {
    return this.prisma.examInvite.findMany({
      include: {
        timelineEvents: { orderBy: { occurredAt: 'asc' } },
        examRequest: { include: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

    async gerarRelatorio(companyId: string, de?: string, ate?: string) {
      const where: any = {
        patient: { companies: { some: { companyId } } },
      };
      if (de) where.createdAt = { ...where.createdAt, gte: new Date(de) };
      if (ate) where.createdAt = { ...where.createdAt, lte: new Date(ate) };

      const requests = await this.prisma.examRequest.findMany({
        where,
        include: {
          patient: true,
          asoDocuments: { orderBy: { signedAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      return requests.map((r) => [
        r.patient.name,
        r.patient.cpf,
        r.patient.functionCboCode ?? '',
        r.examPurpose,
        r.createdAt.toISOString().split('T')[0],
        r.asoDocuments[0]?.decision ?? '',
        r.asoDocuments[0]?.validUntil?.toISOString().split('T')[0] ?? '',
      ]);
    }

    /**
     * Encontra a melhor clínica para uma empresa baseado em:
     * 1. Clínica Matriz da empresa (se definida)
     * 2. Clínica na mesma cidade/estado
     * 3. Clínica Matriz no mesmo estado
     * 4. Qualquer clínica ativa
     */
    async findBestClinicForCompany(companyId: string) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          city: true,
          state: true,
          lat: true,
          lng: true,
          clinicId: true,
          clinic: {
            select: { id: true, name: true, isMatriz: true, city: true, state: true }
          }
        },
      });

      if (!company) throw new Error('Empresa não encontrada');

      // 1. Se empresa já tem clínica atribuída e é Matriz, usa ela
      if (company.clinicId && company.clinic?.isMatriz) {
        return company.clinic;
      }

      // 2. Buscar clínica Matriz na mesma cidade/estado
      const matrizSameCity = await this.prisma.clinic.findFirst({
        where: {
          isActive: true,
          isMatriz: true,
          city: company.city,
          state: company.state,
        },
        orderBy: { createdAt: 'asc' },
      });
      if (matrizSameCity) return matrizSameCity;

      // 3. Buscar qualquer clínica ativa na mesma cidade/estado
      const sameCity = await this.prisma.clinic.findFirst({
        where: {
          isActive: true,
          city: company.city,
          state: company.state,
        },
        orderBy: [{ isMatriz: 'desc' }, { createdAt: 'asc' }],
      });
      if (sameCity) return sameCity;

      // 4. Buscar clínica Matriz no mesmo estado
      const matrizSameState = await this.prisma.clinic.findFirst({
        where: {
          isActive: true,
          isMatriz: true,
          state: company.state,
        },
        orderBy: { createdAt: 'asc' },
      });
      if (matrizSameState) return matrizSameState;

      // 5. Qualquer clínica ativa (fallback)
      const anyClinic = await this.prisma.clinic.findFirst({
        where: { isActive: true },
        orderBy: [{ isMatriz: 'desc' }, { createdAt: 'asc' }],
      });
      if (anyClinic) return anyClinic;

      return null;
    }
  }