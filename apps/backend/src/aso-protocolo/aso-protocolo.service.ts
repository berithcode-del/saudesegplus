import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloDto } from './dto/update-protocolo.dto';
import { ProtocoloQueryDto } from './dto/protocolo-query.dto';
import { StatusProtocolo, TipoExame, Prisma } from '@prisma/client';

@Injectable()
export class AsoProtocoloService {
  constructor(private prisma: PrismaService) {}

  private gerarNumeroProtocolo(): string {
    const ano = new Date().getFullYear();
    const sequencial = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ASO-${ano}-${sequencial}`;
  }

  private registrarHistorico(
    processo: any,
    acao: string,
    de: any,
    para: any,
    userId: string
  ) {
    const historico = processo.historico || [];
    historico.push({
      acao,
      de,
      para,
      userId,
      timestamp: new Date().toISOString(),
    });
    return historico;
  }

  async create(dto: CreateProtocoloDto, userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const numeroProtocolo = this.gerarNumeroProtocolo();

    const processo = await client.processoASO.create({
      data: {
        numeroProtocolo,
        empresaId: dto.empresaId,
        clinicaId: dto.clinicaId,
        pacienteId: dto.pacienteId,
        inviteId: dto.inviteId,
        tipoExame: dto.tipoExame,
        observacoes: dto.observacoes,
        historico: [{
          acao: 'criacao',
          de: null,
          para: { status: StatusProtocolo.INICIADO },
          userId,
          timestamp: new Date().toISOString(),
        }],
      },
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
        invite: true,
      },
    });

    return processo;
  }

  async findAll(query: ProtocoloQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProcessoASOWhereInput = {};

    if (filters.numeroProtocolo) {
      where.numeroProtocolo = { contains: filters.numeroProtocolo, mode: 'insensitive' };
    }
    if (filters.empresaId) where.empresaId = filters.empresaId;
    if (filters.clinicaId) where.clinicaId = filters.clinicaId;
    if (filters.pacienteId) where.pacienteId = filters.pacienteId;
    if (filters.medicoId) where.medicoId = filters.medicoId;
    if (filters.status) where.status = filters.status;
    if (filters.tipoExame) where.tipoExame = filters.tipoExame;
    if (filters.dataInicio || filters.dataFim) {
      where.dataAbertura = {};
      if (filters.dataInicio) where.dataAbertura.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataAbertura.lte = new Date(filters.dataFim);
    }

    const [data, total] = await Promise.all([
      this.prisma.processoASO.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataAbertura: 'desc' },
        include: {
          empresa: { select: { id: true, nomeFantasia: true, razaoSocial: true } },
          clinica: { select: { id: true, name: true } },
          paciente: { select: { id: true, name: true, cpf: true } },
          medico: { select: { id: true, name: true, crmNumber: true, crmState: true } },
        },
      }),
      this.prisma.processoASO.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByNumeroProtocolo(numeroProtocolo: string) {
    const processo = await this.prisma.processoASO.findUnique({
      where: { numeroProtocolo },
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Protocolo ${numeroProtocolo} não encontrado`);
    }

    return processo;
  }

  async findById(id: string) {
    const processo = await this.prisma.processoASO.findUnique({
      where: { id },
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo ${id} não encontrado`);
    }

    return processo;
  }

  async findByIdFull(id: string) {
    const processo = await this.prisma.processoASO.findUnique({
      where: { id },
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
        examRequest: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo ${id} não encontrado`);
    }

    return processo;
  }

  async update(id: string, dto: UpdateProtocoloDto, userId: string) {
    const processo = await this.findById(id);
    const updates: any = {};
    const historico = this.registrarHistorico(processo, 'atualizacao', null, null, userId);

    if (dto.status && dto.status !== processo.status) {
      updates.status = dto.status;
      historico.push({
        acao: 'status',
        de: processo.status,
        para: dto.status,
        userId,
        timestamp: new Date().toISOString(),
      });

      if (dto.status === StatusProtocolo.FINALIZADO) {
        updates.dataConclusao = new Date();
      }
    }

    if (dto.medicoId) {
      updates.medicoId = dto.medicoId;
      historico.push({
        acao: 'medico',
        de: processo.medicoId,
        para: dto.medicoId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    if (dto.observacoes !== undefined) {
      updates.observacoes = dto.observacoes;
    }

    if (dto.documentos) {
      updates.documentos = dto.documentos;
      historico.push({
        acao: 'documentos',
        de: processo.documentos,
        para: dto.documentos,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    updates.historico = historico;

    return this.prisma.processoASO.update({
      where: { id },
      data: updates,
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
      },
    });
  }

  // Admin: force update any field including protocolo number
  async adminUpdate(id: string, dto: UpdateProtocoloDto & { numeroProtocolo?: string }, userId: string) {
    const processo = await this.findById(id);
    const updates: any = {};
    const historico = this.registrarHistorico(processo, 'admin_atualizacao', null, null, userId);

    if (dto.numeroProtocolo && dto.numeroProtocolo !== processo.numeroProtocolo) {
      updates.numeroProtocolo = dto.numeroProtocolo;
      historico.push({
        acao: 'numero_protocolo',
        de: processo.numeroProtocolo,
        para: dto.numeroProtocolo,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    if (dto.status && dto.status !== processo.status) {
      updates.status = dto.status;
      historico.push({
        acao: 'status',
        de: processo.status,
        para: dto.status,
        userId,
        timestamp: new Date().toISOString(),
      });

      if (dto.status === StatusProtocolo.FINALIZADO) {
        updates.dataConclusao = new Date();
      }
    }

    if (dto.medicoId) {
      updates.medicoId = dto.medicoId;
      historico.push({
        acao: 'medico',
        de: processo.medicoId,
        para: dto.medicoId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    if (dto.observacoes !== undefined) {
      updates.observacoes = dto.observacoes;
    }

    if (dto.documentos) {
      updates.documentos = dto.documentos;
      historico.push({
        acao: 'documentos',
        de: processo.documentos,
        para: dto.documentos,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    updates.historico = historico;

    return this.prisma.processoASO.update({
      where: { id },
      data: updates,
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
        medico: true,
        examRequest: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    const processo = await this.findById(id);

    // Soft delete - marcar como finalizado com histórico
    return this.update(id, {
      status: StatusProtocolo.FINALIZADO,
      observacoes: `Cancelado por ${userId}: ${processo.observacoes || ''}`,
    }, userId);
  }

  // Admin: hard delete with cascade
  async adminDelete(id: string, userId: string) {
    const processo = await this.findByIdFull(id);

    // Delete related records first
    await this.prisma.$transaction(async (tx) => {
      // Delete exam request if linked
      if (processo.examRequest) {
        await tx.examRequest.delete({ where: { id: processo.examRequest.id } });
      }

      // Delete processo ASO
      await tx.processoASO.delete({ where: { id } });
    });

    return { success: true, message: 'Protocolo e relações excluídos permanentemente' };
  }

  async getEstatisticas(empresaId?: string, clinicaId?: string) {
    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (clinicaId) where.clinicaId = clinicaId;

    const [porStatus, porTipo, total] = await Promise.all([
      this.prisma.processoASO.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.processoASO.groupBy({
        by: ['tipoExame'],
        where,
        _count: { tipoExame: true },
      }),
      this.prisma.processoASO.count({ where }),
    ]);

    return { porStatus, porTipo, total };
  }
}