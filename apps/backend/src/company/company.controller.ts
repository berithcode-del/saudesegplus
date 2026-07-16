import { Controller, Get, Post, Body, Param, Patch, Put, Query, Res, Delete, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyScopeGuard } from '../auth/company-scope.guard';
import { CompanyInviteScopeGuard } from '../auth/company-invite-scope.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('api/company')
@Roles('ADMIN', 'COMPANY_ADMIN')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async createCompany(@Body() dto: CreateCompanyDto) {
    try {
      const result = await this.companyService.createCompany(dto);
      return { success: true, data: result };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @Roles('ADMIN')
  async listCompanies() {
    try {
      const companies = await this.companyService.listCompanies();
      return { success: true, data: companies };
    } catch (error) {
      throw error;
    }
  }

  // IMPORTANTE: rotas estáticas (sem parâmetro) precisam vir ANTES de
  // '@Get(:id)'. Como estavam declaradas depois, uma chamada a
  // GET /api/company/solicitacoes nunca chegava em listAllInvites — o
  // Nest/Express casava primeiro com '@Get(:id)' e tratava
  // "solicitacoes" como um companyId, retornando null. (bug corrigido)
  @Get('solicitacoes')
  @Roles('ADMIN')
  async listAllInvites() {
    try {
      const invites = await this.companyService.listInvitesForAllCompanies();
      return { success: true, data: invites };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/status-check')
  @UseGuards(CompanyScopeGuard)
  async statusCheck(@Param('id') id: string) {
    try {
      const result = await this.companyService.getStatusCheck(id);
      return { success: true, data: result };
    } catch (error) {
      throw error;
    }
  }

  @Get('invite/:inviteId/timeline')
  @UseGuards(CompanyInviteScopeGuard)
  async getInviteTimeline(@Param('inviteId') inviteId: string) {
    try {
      const timeline = await this.companyService.getInviteTimeline(inviteId);
      return { success: true, data: timeline };
    } catch (error) {
      throw error;
    }
  }

  @Get('invite/search')
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  async searchInvite(
    @Query('cpf') cpf: string,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    try {
      if (!cpf) throw new Error('CPF é obrigatório');
      const invite = await this.companyService.findInviteByCpf(cpf, req.user);
      if (!invite) return { success: false, message: 'Convite não encontrado' };
      return { success: true, data: invite };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(CompanyScopeGuard)
  async getCompany(@Param('id') id: string) {
    try {
      const company = await this.companyService.getCompany(id);
      return { success: true, data: company };
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(CompanyScopeGuard)
  async updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    try {
      const company = await this.companyService.updateCompany(id, dto);
      return { success: true, data: company };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    try {
      const company = await this.companyService.updateCompanyStatus(id, body.status);
      return { success: true, data: company };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/dashboard')
  @UseGuards(CompanyScopeGuard)
  async getDashboard(@Param('id') id: string) {
    try {
      const stats = await this.companyService.getDashboardStats(id);
      return { success: true, data: stats };
    } catch (error) {
      throw error;
    }
  }

  @Post(':id/invite')
  @UseGuards(CompanyScopeGuard)
  async createInvite(@Param('id') companyId: string, @Body() dto: CreateInviteDto) {
    try {
      const invite = await this.companyService.createInvite(companyId, dto);
      return { success: true, data: invite };
    } catch (error) {
      throw error;
    }
  }
  @Delete('invite/:id')
  @UseGuards(CompanyInviteScopeGuard)
  async cancelInvite(@Param('id') id: string) {
    try {
      await this.companyService.cancelInvite(id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/invites')
  @UseGuards(CompanyScopeGuard)
  async listInvites(@Param('id') companyId: string) {
    try {
      const invites = await this.companyService.listInvites(companyId);
      return { success: true, data: invites };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/asos')
  @UseGuards(CompanyScopeGuard)
  async listActiveAsos(@Param('id') companyId: string) {
    try {
      const asos = await this.companyService.listActiveAsos(companyId);
      return { success: true, data: asos };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/relatorio')
  @UseGuards(CompanyScopeGuard)
  async relatorio(@Param('id') id: string, @Res() res: Response, @Query('de') de?: string, @Query('ate') ate?: string) {
    const dados = await this.companyService.gerarRelatorio(id, de, ate);
    const header = 'Nome;CPF;CBO;Tipo Exame;Data;Decisao ASO;Validade ASO\n';
    const csv = header + dados.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${id}.csv"`);
    res.send('\uFEFF' + csv);
  }
}
