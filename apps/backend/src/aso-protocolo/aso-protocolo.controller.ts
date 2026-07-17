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
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('ASO - Protocolos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('aso/protocolos')
export class AsoProtocoloController {
  constructor(private readonly service: AsoProtocoloService) {}

  @Post()
  @Roles('CLINIC', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Criar novo protocolo ASO' })
  async create(@Body() dto: CreateProtocoloDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'CLINIC', 'COMPANY_ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Listar protocolos com filtros e paginação' })
  async findAll(@Query() query: ProtocoloQueryDto) {
    return this.service.findAll(query);
  }

  @Get('estatisticas')
  @Roles('ADMIN', 'CLINIC', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Estatísticas dos protocolos' })
  async getEstatisticas(
    @Query('empresaId') empresaId?: string,
    @Query('clinicaId') clinicaId?: string,
  ) {
    return this.service.getEstatisticas(empresaId, clinicaId);
  }

  @Get('busca/:numeroProtocolo')
  @Roles('ADMIN', 'CLINIC', 'COMPANY_ADMIN', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Buscar protocolo pelo número' })
  async findByNumero(@Param('numeroProtocolo') numeroProtocolo: string) {
    return this.service.findByNumeroProtocolo(numeroProtocolo);
  }

  @Get(':id')
  @Roles('ADMIN', 'CLINIC', 'COMPANY_ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Buscar protocolo por ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles('CLINIC', 'DOCTOR', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Atualizar protocolo (status, médico, documentos, observações)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProtocoloDto, @Request() req) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('CLINIC', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Cancelar protocolo (soft delete)' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.service.delete(id, req.user.id);
  }
}