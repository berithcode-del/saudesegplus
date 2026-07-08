import { Controller, Get, Post, Body, Param, Patch, Put, Query, Res, Delete } from '@nestjs/common';
import type { Response } from 'express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Public()
  @Post()
  async createCompany(@Body() dto: CreateCompanyDto) {
    try {
      const result = await this.companyService.createCompany(dto);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get()
  async listCompanies() {
    try {
      const companies = await this.companyService.listCompanies();
      return { success: true, data: companies };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // IMPORTANTE: rotas estáticas (sem parâmetro) precisam vir ANTES de
  // '@Get(:id)'. Como estavam declaradas depois, uma chamada a
  // GET /api/company/solicitacoes nunca chegava em listAllInvites — o
  // Nest/Express casava primeiro com '@Get(:id)' e tratava
  // "solicitacoes" como um companyId, retornando null. (bug corrigido)
  @Public()
  @Get('solicitacoes')
  async listAllInvites() {
    try {
      const invites = await this.companyService.listInvitesForAllCompanies();
      return { success: true, data: invites };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id/status-check')
  async statusCheck(@Param('id') id: string) {
    try {
      const result = await this.companyService.getStatusCheck(id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get('invite/:inviteId/timeline')
  async getInviteTimeline(@Param('inviteId') inviteId: string) {
    try {
      const timeline = await this.companyService.getInviteTimeline(inviteId);
      return { success: true, data: timeline };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get('invite/search')
  async searchInvite(@Query('cpf') cpf: string) {
    try {
      if (!cpf) throw new Error('CPF é obrigatório');
      const invite = await this.companyService.findInviteByCpf(cpf);
      if (!invite) return { success: false, message: 'Convite não encontrado' };
      return { success: true, data: invite };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id')
  async getCompany(@Param('id') id: string) {
    try {
      const company = await this.companyService.getCompany(id);
      return { success: true, data: company };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Put(':id')
  async updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    try {
      const company = await this.companyService.updateCompany(id, dto);
      return { success: true, data: company };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    try {
      const company = await this.companyService.updateCompanyStatus(id, body.status);
      return { success: true, data: company };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    try {
      const stats = await this.companyService.getDashboardStats(id);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Post(':id/invite')
  async createInvite(@Param('id') companyId: string, @Body() dto: CreateInviteDto) {
    try {
      const invite = await this.companyService.createInvite(companyId, dto);
      return { success: true, data: invite };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  @Public()
  @Delete('invite/:id')
  async cancelInvite(@Param('id') id: string) {
    try {
      await this.companyService.cancelInvite(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id/invites')
  async listInvites(@Param('id') companyId: string) {
    try {
      const invites = await this.companyService.listInvites(companyId);
      return { success: true, data: invites };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id/asos')
  async listActiveAsos(@Param('id') companyId: string) {
    try {
      const asos = await this.companyService.listActiveAsos(companyId);
      return { success: true, data: asos };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Get(':id/relatorio')
  async relatorio(@Param('id') id: string, @Res() res: Response, @Query('de') de?: string, @Query('ate') ate?: string) {
    const dados = await this.companyService.gerarRelatorio(id, de, ate);
    const header = 'Nome,CPF,CBO,Tipo Exame,Data,Decisao ASO,Validade ASO\n';
    const csv = header + dados.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${id}.csv"`);
    res.send('\uFEFF' + csv);
  }
}
