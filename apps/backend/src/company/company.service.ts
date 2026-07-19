import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CompanyGateway } from './company.gateway';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PaymentFlow, PaymentStatus, Prisma, TipoExame, CompanyStatus, TimelineEventType } from '@prisma/client';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
import { basename } from 'path';
import { AsoProtocoloService } from '../aso-protocolo/aso-protocolo.service';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
      private prisma: PrismaService,
      private companyGateway: CompanyGateway,
      private mailService: MailService,
      private storage: SupabaseStorageService,
      private asoProtocoloService: AsoProtocoloService,
    ) {}

  private mapExamTypeToTipoExame(examType: string): TipoExame {
    const map: Record<string, TipoExame> = {
      admissional: TipoExame.ADMISSIONAL,
      periodico: TipoExame.PERIODICO,
      demissional: TipoExame.DEMISSIONAL,
      mudanca_funcao: TipoExame.MUDANCA_FUNCAO,
      retorno: TipoExame.RETORNO_TRABALHO,
      retorno_trabalho: TipoExame.RETORNO_TRABALHO,
    };
    return map[examType?.toLowerCase()] ?? TipoExame.ADMISSIONAL;
  }

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
    const locationChanged =
      dto.cep !== undefined || dto.city !== undefined || dto.state !== undefined;
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });
    if (locationChanged || !updated.clinicId) {
      const clinic = await this.findBestClinicForCompany(companyId, locationChanged);
      if (clinic?.id !== updated.clinicId) {
        return this.prisma.company.update({
          where: { id: companyId },
          data: { clinicId: clinic?.id ?? null },
        });
      }
    }
    return updated;
  }

  async updateCompanyStatus(companyId: string, status: string) {
      return this.prisma.company.update({
        where: { id: companyId },
        data: { status: status as CompanyStatus },
      });
    }

  async createInvite(companyId: string, dto: CreateInviteDto) {
      this.logger.log(`[createInvite] Iniciando criação de convite para empresa=${companyId}, paymentId=${dto.paymentId}, examType=${dto.examType}`);

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          status: true,
          pcmsoValidUntil: true,
          ppraValidUntil: true,
          clinicId: true,
          razaoSocial: true,
        },
      });

      if (!company) {
        this.logger.error(`[createInvite] Empresa não encontrada: ${companyId}`);
        throw new Error('Empresa não encontrada');
      }

      this.logger.log(`[createInvite] Empresa=${companyId}, status=${company.status}, clinicId=${company.clinicId}, pcmsoValidUntil=${company.pcmsoValidUntil}, ppraValidUntil=${company.ppraValidUntil}`);

      const now = new Date();
      const pcmsoValid = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
      const ppraValid = company.ppraValidUntil && company.ppraValidUntil > now;

      if (company.status !== 'LIBERADA') {
        this.logger.warn(`[createInvite] Empresa não LIBERADA: ${companyId}, status=${company.status}`);
        throw new Error(
          `Empresa com status '${company.status}'. É necessário ter documentação PCMSO e PPRA válidas para criar convites.`,
        );
      }

      if (!pcmsoValid || !ppraValid) {
        this.logger.warn(`[createInvite] Documentação vencida: empresa=${companyId}, pcmsoValid=${pcmsoValid}, ppraValid=${ppraValid}`);
        throw new Error(
          'Documentação PCMSO ou PPRA vencida. Por favor, renove os documentos antes de criar novos convites.',
        );
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: dto.paymentId },
        select: {
          id: true,
          companyId: true,
          flow: true,
          status: true,
          quoteSnapshot: true,
          invite: { select: { id: true } },
        },
      });

      this.logger.log(`[createInvite] Payment=${dto.paymentId}, found=${!!payment}, flow=${payment?.flow}, status=${payment?.status}`);

      if (
        !payment ||
        payment.companyId !== companyId ||
        payment.flow !== PaymentFlow.COMPANY_INVITE ||
        payment.status !== PaymentStatus.PAGO
      ) {
        this.logger.warn(`[createInvite] Pagamento inválido: paymentId=${dto.paymentId}, paymentCompany=${payment?.companyId}, expectedCompany=${companyId}, flow=${payment?.flow}, status=${payment?.status}`);
        throw new ConflictException(
          'O convite exige um pagamento empresarial confirmado.',
        );
      }
      if (payment.invite) {
        this.logger.warn(`[createInvite] Pagamento já usado: paymentId=${dto.paymentId}, existingInviteId=${payment.invite.id}`);
        throw new ConflictException(
          'Este pagamento ja foi usado para gerar um convite.',
        );
      }
      try {
        const quote = JSON.parse(payment.quoteSnapshot) as {
          cboCode?: string;
          examPurpose?: string;
        };
        this.logger.log(`[createInvite] Quote do pagamento: cboCode=${quote.cboCode}, examPurpose=${quote.examPurpose}, dtoCboCode=${dto.roleFunctionCboCode}, dtoExamType=${dto.examType}`);

        if (
          quote.cboCode !== dto.roleFunctionCboCode ||
          quote.examPurpose !== dto.examType
        ) {
          this.logger.warn(`[createInvite] CBO/Tipo divergente: quote.cboCode=${quote.cboCode} !== dto.roleFunctionCboCode=${dto.roleFunctionCboCode} OU quote.examPurpose=${quote.examPurpose} !== dto.examType=${dto.examType}`);
          throw new ConflictException(
            'O pagamento foi cotado para outro CBO ou tipo de exame.',
          );
        }
      } catch (error) {
        if (error instanceof ConflictException) throw error;
        this.logger.error(`[createInvite] Erro ao parsear quoteSnapshot: ${error}`);
        throw new ConflictException(
          'A cotacao vinculada ao pagamento e invalida.',
        );
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays ?? 7));

      // Determine clinic: use provided clinicId, or find best clinic for company
      let clinicId = dto.clinicId;
      if (!clinicId) {
        this.logger.log(`[createInvite] ClinicId não fornecido, buscando melhor clínica para empresa=${companyId}`);
        const bestClinic = await this.findBestClinicForCompany(companyId);
        if (bestClinic) {
          clinicId = bestClinic.id;
          this.logger.log(`[createInvite] Melhor clínica encontrada: ${bestClinic.id} (${bestClinic.name})`);
        } else {
                  this.logger.error(`[createInvite] NENHUMA clínica encontrada para empresa=${companyId}`);
                  throw new ConflictException('Nenhuma clínica disponível para esta empresa. Configure uma clínica antes de criar convites.');
                }
              } else {
                this.logger.log(`[createInvite] ClinicId fornecido no DTO: ${clinicId}`);
              }

              // Transação atômica: criar ExamInvite + ProcessoASO (status INICIADO)
      const result = await this.prisma.$transaction(async (tx) => {
        this.logger.log(`[createInvite] Criando ExamInvite: companyId=${companyId}, clinicId=${clinicId}, collaboratorName=${dto.collaboratorName}, expectedEmail=${dto.expectedEmail}`);

        const invite = await tx.examInvite.create({
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
            examType: this.mapExamTypeToTipoExame(dto.examType),
            paymentId: payment.id,
            expiresAt,
            status: 'ENVIADO',
          },
          include: { company: true },
        });

        this.logger.log(`[createInvite] ExamInvite criado com sucesso: inviteId=${invite.id}, token=${invite.token}`);

        // Criar ProcessoASO (status INICIADO) acompanhando o convite desde o pagamento
                const protocolo = await this.asoProtocoloService.create(
                  {
                    empresaId: companyId,
                    clinicaId: clinicId ?? undefined,
                    tipoExame: this.mapExamTypeToTipoExame(dto.examType),
                    inviteId: invite.id,
                    observacoes: `Protocolo gerado no pagamento para colaborador ${dto.collaboratorName}`,
                  },
                  'system',
                  tx,
                );

        this.logger.log(`[createInvite] ProcessoASO criado: protocolo=${protocolo.numeroProtocolo}, id=${protocolo.id}`);

        // Vincular protocolo ao convite
        await tx.examInvite.update({
          where: { id: invite.id },
          data: { processoAsoId: protocolo.id },
        });

        await tx.examTimelineEvent.create({
          data: {
            inviteId: invite.id,
            eventType: 'LINK_ENVIADO',
          },
        });

        return { invite, protocolo };
      }, {
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });

      const { invite, protocolo } = result;

      // Emitir WS após transação committada
      this.companyGateway.emitTimelineUpdate(companyId, {
        inviteId: invite.id,
        eventType: 'LINK_ENVIADO',
        occurredAt: invite.sentAt.toISOString(),
      });

      if (dto.expectedEmail) {
              const link = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/p/${invite.token}`;
              await this.mailService
                .sendInviteLink(
                  dto.expectedEmail,
                  invite.company.razaoSocial ?? '',
                  link,
                  invite.expiresAt,
                )
                .catch((err) => {
                  this.logger.error(`[Mail] Falha ao enviar e-mail para ${dto.expectedEmail}: ${err.message}`, err.stack);
                  // Não lança erro para não bloquear o fluxo — convite já foi criado
                });
            }

      return invite;
  }

  async listInvites(companyId: string) {
      return this.prisma.examInvite.findMany({
        where: { companyId },
        include: {
          timelineEvents: { orderBy: { occurredAt: 'asc' } },
          examRequest: { include: { results: true } },
          processoAso: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

  async listActiveAsos(companyId: string) {
    const now = new Date();
    const asos = await this.prisma.asoDocument.findMany({
      where: {
        pdfUrl: { not: null },
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
                                  processoAso: true,
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

  async getAsoPdf(companyId: string, asoId: string) {
    const now = new Date();
    const aso = await this.prisma.asoDocument.findFirst({
      where: {
        id: asoId,
        pdfUrl: { not: null },
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
    });
    if (!aso?.pdfUrl) throw new NotFoundException('ASO nao encontrado');
    const fileName = basename(aso.pdfUrl);
    return { buffer: await this.storage.downloadAsoFile(fileName), fileName };
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
      inviteId: string;
      examRequestId?: string;
      eventType: TimelineEventType;
    }) {
      return this.prisma.examTimelineEvent.create({
        data: {
          inviteId: data.inviteId,
          examRequestId: data.examRequestId,
          eventType: data.eventType,
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
      invite: { companyId },
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
    ].map((value) => {
      const safeValue = String(value ?? '');
      return /[",;\n\r]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
    }).join(';'));
  }

  /**
   * Encontra a melhor clínica para uma empresa baseado em:
   * 1. Clínica Matriz da empresa (se definida)
   * 2. Clínica na mesma cidade/estado
   * 3. Clínica Matriz no mesmo estado
   * 4. Qualquer clínica ativa
   */
  async findBestClinicForCompany(companyId: string, ignoreCurrentAssignment = false) {
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
          select: {
            id: true,
            name: true,
            isMatriz: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!company) throw new Error('Empresa não encontrada');

    // 1. Se empresa já tem clínica atribuída e é Matriz, usa ela
    if (!ignoreCurrentAssignment && company.clinicId && company.clinic?.isMatriz) {
      return company.clinic;
    }

    if (company.lat !== null && company.lng !== null) {
      const clinics = await this.prisma.clinic.findMany({
        where: { isActive: true, lat: { not: null }, lng: { not: null } },
      });
      const nearest = clinics
        .map((clinic) => ({
          clinic,
          distance: this.distanceKm(company.lat!, company.lng!, clinic.lat!, clinic.lng!),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance <= 100) return nearest.clinic;
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

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const a =
      Math.sin((toRadians(lat2) - toRadians(lat1)) / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin((toRadians(lng2) - toRadians(lng1)) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
