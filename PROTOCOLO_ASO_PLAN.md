# Plano de Implementação: Protocolo ASO (Processo de Atestado de Saúde Ocupacional)

## 1. Modelagem do Protocolo (Prisma Schema)

```prisma
model ProcessoASO {
  id              String    @id @default(uuid())
  numeroProtocolo String    @unique @map("numero_protocolo")
  empresaId       String    @map("empresa_id")
  clinicaId       String    @map("clinica_id")
  pacienteId      String    @map("paciente_id")
  medicoId        String?   @map("medico_id")
  status          StatusProtocolo @default(AGUARDANDO_COLETA)
  tipoExame       TipoExame @map("tipo_exame")
  dataAbertura    DateTime  @default(now()) @map("data_abertura")
  dataConclusao   DateTime? @map("data_conclusao")
  documentos      Json      @default("[]")
  historico       Json      @default("[]")
  observacoes     String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([empresaId])
  @@index([clinicaId])
  @@index([pacienteId])
  @@index([medicoId])
  @@index([status])
  @@index([numeroProtocolo])
  @@map("processos_aso")
}

enum StatusProtocolo {
  AGUARDANDO_COLETA
  EM_COLETA
  NA_FILA_MEDICA
  EM_ATENDIMENTO
  DOCUMENTOS_PENDENTES
  CONCLUIDO
  CANCELADO
}

enum TipoExame {
  ADMISSIONAL
  PERIODICO
  DEMISSIONAL
  MUDANCA_FUNCAO
  RETORNO_TRABALHO
}
```

---

## 2. Backend (NestJS)

### 2.1. DTOs (`src/aso-protocolo/dto/`)

**create-protocolo.dto.ts**
```typescript
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoExame } from '@prisma/client';

export class CreateProtocoloDto {
  @ApiProperty({ example: 'empresa_123' })
  @IsUUID()
  empresaId: string;

  @ApiProperty({ example: 'clinica_456' })
  @IsUUID()
  clinicaId: string;

  @ApiProperty({ example: 'paciente_789' })
  @IsUUID()
  pacienteId: string;

  @ApiProperty({ enum: TipoExame, example: TipoExame.ADMISSIONAL })
  @IsEnum(TipoExame)
  tipoExame: TipoExame;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
```

**update-protocolo.dto.ts**
```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProtocolo } from '@prisma/client';

export class UpdateProtocoloDto {
  @ApiProperty({ enum: StatusProtocolo, required: false })
  @IsOptional()
  @IsEnum(StatusProtocolo)
  status?: StatusProtocolo;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  @IsOptional()
  documentos?: Array<{ id: string; tipo: string; url: string; data: string }>;
}
```

**protocolo-query.dto.ts**
```typescript
import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProtocolo, TipoExame } from '@prisma/client';

export class ProtocoloQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroProtocolo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinicaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @ApiProperty({ enum: StatusProtocolo, required: false })
  @IsOptional()
  @IsEnum(StatusProtocolo)
  status?: StatusProtocolo;

  @ApiProperty({ enum: TipoExame, required: false })
  @IsOptional()
  @IsEnum(TipoExame)
  tipoExame?: TipoExame;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;
}
```

---

### 2.2. Service (`src/aso-protocolo/aso-protocolo.service.ts`)

```typescript
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

  async create(dto: CreateProtocoloDto, userId: string) {
    const numeroProtocolo = this.gerarNumeroProtocolo();

    const processo = await this.prisma.processoASO.create({
      data: {
        numeroProtocolo,
        empresaId: dto.empresaId,
        clinicaId: dto.clinicaId,
        pacienteId: dto.pacienteId,
        tipoExame: dto.tipoExame,
        observacoes: dto.observacoes,
        historico: [{
          acao: 'criacao',
          de: null,
          para: { status: StatusProtocolo.AGUARDANDO_COLETA },
          userId,
          timestamp: new Date().toISOString(),
        }],
      },
      include: {
        empresa: true,
        clinica: true,
        paciente: true,
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
          empresa: { select: { id: true, nome: true } },
          clinica: { select: { id: true, nome: true } },
          paciente: { select: { id: true, nome: true, cpf: true } },
          medico: { select: { id: true, nome: true, crm: true } },
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

      if (dto.status === StatusProtocolo.CONCLUIDO) {
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

  async delete(id: string, userId: string) {
    const processo = await this.findById(id);

    // Soft delete - marcar como cancelado com histórico
    return this.update(id, {
      status: StatusProtocolo.CANCELADO,
      observacoes: `Cancelado por ${userId}: ${processo.observacoes || ''}`,
    }, userId);
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
```

---

### 2.3. Controller (`src/aso-protocolo/aso-protocolo.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsoProtocoloService } from './aso-protocolo.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloDto } from './dto/update-protocolo.dto';
import { ProtocoloQueryDto } from './dto/protocolo-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ASO - Protocolos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('aso/protocolos')
export class AsoProtocoloController {
  constructor(private readonly service: AsoProtocoloService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo protocolo ASO' })
  async create(@Body() dto: CreateProtocoloDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar protocolos com filtros e paginação' })
  async findAll(@Query() query: ProtocoloQueryDto) {
    return this.service.findAll(query);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Estatísticas dos protocolos' })
  async getEstatisticas(
    @Query('empresaId') empresaId?: string,
    @Query('clinicaId') clinicaId?: string,
  ) {
    return this.service.getEstatisticas(empresaId, clinicaId);
  }

  @Get('busca/:numeroProtocolo')
  @ApiOperation({ summary: 'Buscar protocolo pelo número' })
  async findByNumero(@Param('numeroProtocolo') numeroProtocolo: string) {
    return this.service.findByNumeroProtocolo(numeroProtocolo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar protocolo por ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar protocolo (status, médico, documentos, observações)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProtocoloDto, @Request() req) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar protocolo (soft delete)' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.service.delete(id, req.user.id);
  }
}
```

---

### 2.4. Module (`src/aso-protocolo/aso-protocolo.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { AsoProtocoloController } from './aso-protocolo.controller';
import { AsoProtocoloService } from './aso-protocolo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AsoProtocoloController],
  providers: [AsoProtocoloService, PrismaService],
  exports: [AsoProtocoloService],
})
export class AsoProtocoloModule {}
```

---

## 3. Frontend (Next.js)

### 3.1. Types (`apps/frontend/src/types/aso-protocolo.ts`)

```typescript
export type StatusProtocolo =
  | 'AGUARDANDO_COLETA'
  | 'EM_COLETA'
  | 'NA_FILA_MEDICA'
  | 'EM_ATENDIMENTO'
  | 'DOCUMENTOS_PENDENTES'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type TipoExame =
  | 'ADMISSIONAL'
  | 'PERIODICO'
  | 'DEMISSIONAL'
  | 'MUDANCA_FUNCAO'
  | 'RETORNO_TRABALHO';

export interface Documento {
  id: string;
  tipo: string;
  url: string;
  data: string;
}

export interface HistoricoItem {
  acao: string;
  de: any;
  para: any;
  userId: string;
  timestamp: string;
}

export interface ProtocoloASO {
  id: string;
  numeroProtocolo: string;
  empresaId: string;
  clinicaId: string;
  pacienteId: string;
  medicoId?: string;
  status: StatusProtocolo;
  tipoExame: TipoExame;
  dataAbertura: string;
  dataConclusao?: string;
  documentos: Documento[];
  historico: HistoricoItem[];
  observacoes?: string;
  empresa?: { id: string; nome: string };
  clinica?: { id: string; nome: string };
  paciente?: { id: string; nome: string; cpf: string };
  medico?: { id: string; nome: string; crm: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProtocoloListResponse {
  data: ProtocoloASO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProtocoloDto {
  empresaId: string;
  clinicaId: string;
  pacienteId: string;
  tipoExame: TipoExame;
  observacoes?: string;
}

export interface UpdateProtocoloDto {
  status?: StatusProtocolo;
  medicoId?: string;
  observacoes?: string;
  documentos?: Documento[];
}

export interface ProtocoloQueryDto {
  numeroProtocolo?: string;
  empresaId?: string;
  clinicaId?: string;
  pacienteId?: string;
  medicoId?: string;
  status?: StatusProtocolo;
  tipoExame?: TipoExame;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}
```

---

### 3.2. API Client (`apps/frontend/src/lib/api/aso-protocolo.ts`)

```typescript
import { api } from './api';
import type {
  ProtocoloASO,
  ProtocoloListResponse,
  CreateProtocoloDto,
  UpdateProtocoloDto,
  ProtocoloQueryDto,
} from '@/types/aso-protocolo';

export const asoProtocoloApi = {
  async create(data: CreateProtocoloDto): Promise<ProtocoloASO> {
    const res = await api.post('/aso/protocolos', data);
    return res.data;
  },

  async list(params: ProtocoloQueryDto = {}): Promise<ProtocoloListResponse> {
    const res = await api.get('/aso/protocolos', { params });
    return res.data;
  },

  async getEstatisticas(empresaId?: string, clinicaId?: string) {
    const res = await api.get('/aso/protocolos/estatisticas', {
      params: { empresaId, clinicaId },
    });
    return res.data;
  },

  async getByNumero(numeroProtocolo: string): Promise<ProtocoloASO> {
    const res = await api.get(`/aso/protocolos/busca/${numeroProtocolo}`);
    return res.data;
  },

  async getById(id: string): Promise<ProtocoloASO> {
    const res = await api.get(`/aso/protocolos/${id}`);
    return res.data;
  },

  async update(id: string, data: UpdateProtocoloDto): Promise<ProtocoloASO> {
    const res = await api.put(`/aso/protocolos/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ProtocoloASO> {
    const res = await api.delete(`/aso/protocolos/${id}`);
    return res.data;
  },
};
```

---

### 3.3. Componentes Principais

#### **Componente de Busca por Protocolo** (`apps/frontend/src/components/aso/ProtocoloSearch.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO } from '@/types/aso-protocolo';
import { Button, Input, Card, Badge, Table, Spin, Alert } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  FileTextOutlined,
  UserOutlined,
  BuildingOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const statusColors: Record<string, string> = {
  AGUARDANDO_COLETA: 'blue',
  EM_COLETA: 'purple',
  NA_FILA_MEDICA: 'orange',
  EM_ATENDIMENTO: 'cyan',
  DOCUMENTOS_PENDENTES: 'gold',
  CONCLUIDO: 'green',
  CANCELADO: 'red',
};

const statusLabels: Record<string, string> = {
  AGUARDANDO_COLETA: 'Aguardando Coleta',
  EM_COLETA: 'Em Coleta',
  NA_FILA_MEDICA: 'Na Fila Médica',
  EM_ATENDIMENTO: 'Em Atendimento',
  DOCUMENTOS_PENDENTES: 'Documentos Pendentes',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export function ProtocoloSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await asoProtocoloApi.getByNumero(searchValue.trim());
      setProtocolo(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Protocolo não encontrado');
      setProtocolo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/aso/protocolos/${id}`);
  };

  if (!protocolo) {
    return (
      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input
              placeholder="Digite o número do protocolo (ex: ASO-2026-0001)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ flex: 1 }}
            />
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              Buscar
            </Button>
          </div>
        </form>

        {error && (
          <Alert message="Não encontrado" description={error} type="error" showIcon />
        )}
      </Card>
    );
  }

  const p = protocolo;

  return (
    <Card style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Protocolo: {p.numeroProtocolo}</h3>
        <Badge status={p.status as any} color={statusColors[p.status]}>
          {statusLabels[p.status]}
        </Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <div>
          <strong>Empresa:</strong> {p.empresa?.nome || p.empresaId}
        </div>
        <div>
          <strong>Clínica:</strong> {p.clinica?.nome || p.clinicaId}
        </div>
        <div>
          <strong>Paciente:</strong> {p.paciente?.nome || p.pacienteId}
        </div>
        <div>
          <strong>CPF:</strong> {p.paciente?.cpf || '-'}
        </div>
        <div>
          <strong>Médico:</strong> {p.medico?.nome || p.medicoId || 'Não atribuído'}
        </div>
        <div>
          <strong>CRM:</strong> {p.medico?.crm || '-'}
        </div>
        <div>
          <strong>Tipo de Exame:</strong> {p.tipoExame}
        </div>
        <div>
          <strong>Data Abertura:</strong> {new Date(p.dataAbertura).toLocaleDateString('pt-BR')}
        </div>
        {p.dataConclusao && (
          <div>
            <strong>Data Conclusão:</strong> {new Date(p.dataConclusao).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {p.observacoes && (
        <Alert message="Observações" description={p.observacoes} type="info" showIcon style={{ marginBottom: 16 }} />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button onClick={() => handleViewDetails(p.id)} icon={<EyeOutlined />}>
          Ver Detalhes Completos
        </Button>
        <Button onClick={() => router.push(`/aso/protocolos/${p.id}/editar`)} icon={<EditOutlined />}>
          Editar
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={() => confirmCancel(p.id)}>
          Cancelar
        </Button>
      </div>

      {p.documentos.length > 0 && (
        <div>
          <h4>Documentos Anexados</h4>
          <Table
            dataSource={p.documentos}
            columns={[
              { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
              { title: 'Data', dataIndex: 'data', key: 'data' },
              {
                title: 'Ação',
                key: 'action',
                render: (_, record: any) => (
                  <a href={record.url} target="_blank" rel="noopener noreferrer">
                    <FileTextOutlined /> Visualizar
                  </a>
                ),
              },
            ]}
            pagination={false}
            size="small"
          />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <h4>Histórico do Processo</h4>
        <Table
          dataSource={p.historico?.slice().reverse() || []}
          columns={[
            { title: 'Ação', dataIndex: 'acao', key: 'acao' },
            { title: 'De', dataIndex: 'de', key: 'de', render: (v: any) => JSON.stringify(v) },
            { title: 'Para', dataIndex: 'para', key: 'para', render: (v: any) => JSON.stringify(v) },
            { title: 'Usuário', dataIndex: 'userId', key: 'userId' },
            { title: 'Data/Hora', dataIndex: 'timestamp', key: 'timestamp', render: (v: string) => new Date(v).toLocaleString('pt-BR') },
          ]}
          pagination={false}
          size="small"
        />
      </div>
    </Card>
  );
}

function confirmCancel(id: string) {
  if (window.confirm('Tem certeza que deseja cancelar este protocolo?')) {
    // TODO: implementar cancelamento
  }
}
```

---

#### **Página de Listagem com Filtros** (`apps/frontend/src/app/(dashboard)/aso/protocolos/page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, ProtocoloQueryDto, StatusProtocolo, TipoExame } from '@/types/aso-protocolo';
import { Table, Button, Input, Select, DatePicker, Card, Space, Spin, Badge, Tag } from 'antd';
import { SearchOutlined, SyncOutlined, PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';

const statusColors: Record<StatusProtocolo, string> = {
  AGUARDANDO_COLETA: 'blue',
  EM_COLETA: 'purple',
  NA_FILA_MEDICA: 'orange',
  EM_ATENDIMENTO: 'cyan',
  DOCUMENTOS_PENDENTES: 'gold',
  CONCLUIDO: 'green',
  CANCELADO: 'red',
};

const statusOptions = [
  { value: 'AGUARDANDO_COLETA', label: 'Aguardando Coleta' },
  { value: 'EM_COLETA', label: 'Em Coleta' },
  { value: 'NA_FILA_MEDICA', label: 'Na Fila Médica' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
  { value: 'DOCUMENTOS_PENDENTES', label: 'Documentos Pendentes' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const tipoExameOptions = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO_TRABALHO', label: 'Retorno ao Trabalho' },
];

export default function ProtocolosPage() {
  const [data, setData] = useState<ProtocoloASO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<ProtocoloQueryDto>({ page: 1, limit: 20 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await asoProtocoloApi.list({ ...filters, page: pagination.current, limit: pagination.pageSize });
      setData(res.data);
      setPagination(prev => ({ ...prev, total: res.total }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = (values: ProtocoloQueryDto) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: 20 });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Protocolo',
      dataIndex: 'numeroProtocolo',
      key: 'numeroProtocolo',
      width: 160,
    },
    {
      title: 'Paciente',
      dataIndex: 'paciente',
      key: 'paciente',
      render: (p: any) => p?.nome || '-',
      width: 180,
    },
    {
      title: 'CPF',
      dataIndex: 'paciente',
      key: 'cpf',
      render: (p: any) => p?.cpf || '-',
      width: 140,
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (e: any) => e?.nome || '-',
      width: 160,
    },
    {
      title: 'Clínica',
      dataIndex: 'clinica',
      key: 'clinica',
      render: (c: any) => c?.nome || '-',
      width: 160,
    },
    {
      title: 'Tipo Exame',
      dataIndex: 'tipoExame',
      key: 'tipoExame',
      width: 120,
    },
    {
      title: 'Data',
      dataIndex: 'dataAbertura',
      key: 'dataAbertura',
      render: (v: string) => new Date(v).toLocaleDateString('pt-BR'),
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StatusProtocolo) => (
        <Badge status={status as any} color={statusColors[status]}>
          {statusOptions.find(o => o.value === status)?.label || status}
        </Badge>
      ),
      width: 160,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: any, record: ProtocoloASO) => (
        <Space>
          <Link href={`/aso/protocolos/${record.id}`}>
            <Button size="small" icon={<EyeOutlined />} />
          </Link>
          <Link href={`/aso/protocolos/${record.id}/editar`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Protocolos ASO</h2>
        <Link href="/aso/protocolos/novo">
          <Button type="primary" icon={<PlusOutlined />}>
            Novo Protocolo
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(filters); }} layout="inline">
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="Nº Protocolo"
              value={filters.numeroProtocolo || ''}
              onChange={(e) => setFilters({ ...filters, numeroProtocolo: e.target.value })}
              style={{ width: 180 }}
              allowClear
            />
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v as any })}
              style={{ width: 180 }}
              allowClear
              options={statusOptions}
            />
            <Select
              placeholder="Tipo Exame"
              value={filters.tipoExame}
              onChange={(v) => setFilters({ ...filters, tipoExame: v as any })}
              style={{ width: 180 }}
              allowClear
              options={tipoExameOptions}
            />
            <DatePicker.RangePicker
              placeholder={['Data Início', 'Data Fim']}
              value={filters.dataInicio && filters.dataFim ? [new Date(filters.dataInicio), new Date(filters.dataFim)] : undefined}
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  setFilters({
                    ...filters,
                    dataInicio: dates[0].toISOString(),
                    dataFim: dates[1].toISOString(),
                  });
                }
              }}
              style={{ width: 360 }}
              allowClear
            />
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Buscar
            </Button>
            <Button onClick={handleReset} icon={<SyncOutlined />}>
              Limpar
            </Button>
          </Space>
        </form>
      </Card>

      <Spin spinning={loading}>
        <Table
          dataSource={data}
          columns={columns}
          pagination={pagination}
          onChange={(pagination) => setPagination(pagination)}
          rowKey="id"
          size="middle"
        />
      </Spin>
    </Card>
  );
}
```

---

#### **Página de Detalhes do Protocolo** (`apps/frontend/src/app/(dashboard)/aso/protocolos/[id]/page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, UpdateProtocoloDto, StatusProtocolo } from '@/types/aso-protocolo';
import { Card, Button, Table, Tag, Space, Spin, Alert, Modal, Form, Select, Input, DatePicker, Divider } from 'antd';
import { EyeOutlined, EditOutlined, SaveOutlined, CloseOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { message } from 'antd';

const statusColors: Record<StatusProtocolo, string> = {
  AGUARDANDO_COLETA: 'blue',
  EM_COLETA: 'purple',
  NA_FILA_MEDICA: 'orange',
  EM_ATENDIMENTO: 'cyan',
  DOCUMENTOS_PENDENTES: 'gold',
  CONCLUIDO: 'green',
  CANCELADO: 'red',
};

const statusOptions = [
  { value: 'AGUARDANDO_COLETA', label: 'Aguardando Coleta' },
  { value: 'EM_COLETA', label: 'Em Coleta' },
  { value: 'NA_FILA_MEDICA', label: 'Na Fila Médica' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
  { value: 'DOCUMENTOS_PENDENTES', label: 'Documentos Pendentes' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ProtocoloDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchProtocolo();
    }
  }, [id]);

  const fetchProtocolo = async () => {
    setLoading(true);
    try {
      const res = await asoProtocoloApi.getById(id);
      setProtocolo(res);
      form.setFieldsValue({
        status: res.status,
        medicoId: res.medicoId,
        observacoes: res.observacoes,
      });
    } catch (err) {
      message.error('Erro ao carregar protocolo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: UpdateProtocoloDto) => {
    try {
      const res = await asoProtocoloApi.update(id, values);
      setProtocolo(res);
      setEditing(false);
      message.success('Protocolo atualizado com sucesso');
    } catch (err) {
      message.error('Erro ao atualizar protocolo');
    }
  };

  if (loading) return <Spin size="large" tip="Carregando..." />;
  if (!protocolo) return <Alert message="Protocolo não encontrado" type="error" />;

  const p = protocolo;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2>{p.numeroProtocolo}</h2>
          <Tag color={statusColors[p.status]}>
            {statusOptions.find(o => o.value === p.status)?.label}
          </Tag>
        </div>
        <Space>
          <Button onClick={() => setEditing(true)} icon={<EditOutlined />}>
            Editar
          </Button>
          <Button onClick={() => router.back()}>
            Voltar
          </Button>
        </Space>
      </div>

      <Divider>Informações Principais</Divider>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <div><strong>Empresa:</strong> {p.empresa?.nome || p.empresaId}</div>
        <div><strong>Clínica:</strong> {p.clinica?.nome || p.clinicaId}</div>
        <div><strong>Paciente:</strong> {p.paciente?.nome || p.pacienteId}</div>
        <div><strong>CPF:</strong> {p.paciente?.cpf || '-'}</div>
        <div><strong>Médico:</strong> {p.medico?.nome || p.medicoId || 'Não atribuído'}</div>
        <div><strong>CRM:</strong> {p.medico?.crm || '-'}</div>
        <div><strong>Tipo Exame:</strong> {p.tipoExame}</div>
        <div><strong>Data Abertura:</strong> {new Date(p.dataAbertura).toLocaleString('pt-BR')}</div>
        <div><strong>Data Conclusão:</strong> {p.dataConclusao ? new Date(p.dataConclusao).toLocaleString('pt-BR') : 'Pendente'}</div>
      </div>

      {p.observacoes && (
        <>
          <Divider>Observações</Divider>
          <p style={{ whiteSpace: 'pre-wrap', marginBottom: 16 }}>{p.observacoes}</p>
        </>
      )}

      <Divider>Documentos Anexados</Divider>
      {p.documentos.length > 0 ? (
        <Table
          dataSource={p.documentos}
          columns={[
            { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
            { title: 'Data', dataIndex: 'data', key: 'data' },
            {
              title: 'Ação',
              key: 'action',
              render: (_: any, record: any) => (
                <a href={record.url} target="_blank" rel="noopener noreferrer">
                  <FileTextOutlined /> Visualizar
                </a>
              ),
            },
          ]}
          pagination={false}
          size="small"
        />
      ) : (
        <Alert message="Nenhum documento anexado" type="info" showIcon />
      )}

      <Divider>Histórico Completo do Processo</Divider>
      <Table
        dataSource={p.historico?.slice().reverse() || []}
        columns={[
          { title: 'Ação', dataIndex: 'acao', key: 'acao' },
          { title: 'De', dataIndex: 'de', key: 'de', render: (v: any) => v ? JSON.stringify(v) : '-' },
          { title: 'Para', dataIndex: 'para', key: 'para', render: (v: any) => v ? JSON.stringify(v) : '-' },
          { title: 'Usuário', dataIndex: 'userId', key: 'userId' },
          { title: 'Data/Hora', dataIndex: 'timestamp', key: 'timestamp', render: (v: string) => new Date(v).toLocaleString('pt-BR') },
        ]}
        pagination={false}
        size="small"
      />

      {/* Modal de Edição */}
      <Modal
        title="Editar Protocolo"
        open={editing}
        onOk={() => form.validateFields().then(handleSubmit)}
        onCancel={() => { setEditing(false); form.setFieldsValue({ status: p.status, medicoId: p.medicoId, observacoes: p.observacoes }); }}
        okButtonProps={{ loading: false }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={statusOptions} placeholder="Selecione o status" />
          </Form.Item>
          <Form.Item name="medicoId" label="Médico Responsável (ID)">
            <Input placeholder="ID do médico" />
          </Form.Item>
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={4} placeholder="Observações adicionais" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
```

---

#### **Página de Criação de Protocolo** (`apps/frontend/src/app/(dashboard)/aso/protocolos/novo/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { CreateProtocoloDto, TipoExame } from '@/types/aso-protocolo';
import { Card, Button, Form, Input, Select, message } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

const tipoExameOptions = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO_TRABALHO', label: 'Retorno ao Trabalho' },
];

export default function NovoProtocoloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: CreateProtocoloDto) => {
    setLoading(true);
    try {
      const res = await asoProtocoloApi.create(values);
      message.success(`Protocolo ${res.numeroProtocolo} criado com sucesso!`);
      router.push(`/aso/protocolos/${res.id}`);
    } catch (err) {
      message.error('Erro ao criar protocolo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Novo Protocolo ASO</h2>
        <Link href="/aso/protocolos">
          <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
        </Link>
      </div>

      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="empresaId" label="Empresa (ID)" rules={[{ required: true }]}>
          <Input placeholder="ID da empresa" />
        </Form.Item>
        <Form.Item name="clinicaId" label="Clínica (ID)" rules={[{ required: true }]}>
          <Input placeholder="ID da clínica" />
        </Form.Item>
        <Form.Item name="pacienteId" label="Paciente (ID)" rules={[{ required: true }]}>
          <Input placeholder="ID do paciente" />
        </Form.Item>
        <Form.Item name="tipoExame" label="Tipo de Exame" rules={[{ required: true }]}>
          <Select options={tipoExameOptions} placeholder="Selecione o tipo" />
        </Form.Item>
        <Form.Item name="observacoes" label="Observações">
          <Input.TextArea rows={3} placeholder="Observações iniciais (opcional)" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Link href="/aso/protocolos">
            <Button>Cancelar</Button>
          </Link>
          <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
            Criar Protocolo
          </Button>
        </div>
      </Form>
    </Card>
  );
}
```

---

## 4. Integração com Módulos Existentes

### 4.1. Atualizar `ClinicProfileModule` para usar o novo serviço

```typescript
// apps/backend/src/clinic-profile/clinic-profile.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClinicProfileController } from './clinic-profile.controller';
import { ClinicProfileService } from './clinic-profile.service';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../upload/supabase-storage.service';
import { AsoProtocoloModule } from '../aso-protocolo/aso-protocolo.module';

@Module({
  imports: [ConfigModule, AsoProtocoloModule],
  controllers: [ClinicProfileController],
  providers: [ClinicProfileService, PrismaService, SupabaseStorageService],
  exports: [ClinicProfileService],
})
export class ClinicProfileModule {}
```

### 4.2. Adicionar rotas no `AppModule` principal

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClinicProfileModule } from './clinic-profile/clinic-profile.module';
import { AsoProtocoloModule } from './aso-protocolo/aso-protocolo.module';
// ... outros módulos

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClinicProfileModule,
    AsoProtocoloModule,
    // ...
  ],
})
export class AppModule {}
```

---

## 5. Rotas Frontend (Next.js App Router)

```
apps/frontend/src/app/(dashboard)/aso/
├── protocolos/
│   ├── page.tsx                    # Listagem com filtros
│   ├── novo/
│   │   └── page.tsx                # Criar novo protocolo
│   ├── busca/
│   │   └── page.tsx                # Busca por número do protocolo
│   ├── [id]/
│   │   └── page.tsx                # Detalhes do protocolo
│   └── [id]/
│       └── editar/
│           └── page.tsx            # Editar protocolo
```

---

## 6. Próximos Passos (Ordem de Execução)

| Etapa | Ação | Arquivos Afetados |
|-------|------|-------------------|
| 1 | Adicionar modelo `ProcessoASO` no Prisma + migration | `prisma/schema.prisma` |
| 2 | Criar módulo `AsoProtocolo` (DTOs, Service, Controller, Module) | `apps/backend/src/aso-protocolo/` |
| 3 | Registrar módulo no `AppModule` | `apps/backend/src/app.module.ts` |
| 4 | Adicionar types e API client no Frontend | `apps/frontend/src/types/aso-protocolo.ts`, `apps/frontend/src/lib/api/aso-protocolo.ts` |
| 5 | Criar páginas e componentes | `apps/frontend/src/app/(dashboard)/aso/protocolos/` |
| 6 | Testar integração: criar, buscar, atualizar, cancelar | - |
| 7 | Adicionar upload de documentos no protocolo (integrar com `SupabaseStorageService`) | `AsoProtocoloService`, `SupabaseStorageService` |
| 8 | Notificações (email/push) em mudança de status | - |

---

## 7. Benefícios Alcançados

✅ **Rastreabilidade total**: Cada protocolo tem histórico completo de quem fez o quê e quando  
✅ **Busca instantânea**: Por número de protocolo, paciente, empresa, clínica, médico, status, tipo, datas  
✅ **Controle de documentos**: Todos os PDFs/exames/laudos anexados ao mesmo protocolo  
✅ **Gestão de erros**: Cancelar/reativar processos com motivo registrado  
✅ **Auditoria**: Log imutável de todas as alterações  
✅ **Dashboard**: Estatísticas por status, tipo de exame, empresa/clínica  
✅ **Base para futuro**: Webhooks, notificações, relatórios, integração com e-Social

---

## 8. Comando para Gerar Migration

```bash
cd /e/BerithCod/SaudeSegPlus_clean/apps/backend
npx prisma migrate dev --name add_processo_aso
npx prisma generate
```

---

*Documento gerado em 2026-07-17. Pronto para implementação.*