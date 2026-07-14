import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, ForbiddenException } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/financial')
@Roles('ADMIN')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ── Configuração global ────────────────────────────────────────────────────

  @Get('config')
  async getConfig() {
    const data = await this.financialService.getConfig();
    return { success: true, data };
  }

  @Patch('config')
  async updateConfig(@Body() body: { defaultClinicFeePercent?: number; defaultDoctorFeePercent?: number; defaultPlatformFeePercent?: number }) {
    const data = await this.financialService.updateConfig(body);
    return { success: true, data };
  }

  // ── Preços de serviço ─────────────────────────────────────────────────────

  @Get('service-prices')
  async listServicePrices() {
    const data = await this.financialService.listServicePrices();
    return { success: true, data };
  }

  @Post('service-prices')
  async createServicePrice(@Body() body: { name: string; description?: string; basePrice: number; clinicFeePercent: number; doctorFeePercent: number; platformFeePercent: number }) {
    const data = await this.financialService.createServicePrice(body);
    return { success: true, data };
  }

  @Patch('service-prices/:id')
  async updateServicePrice(@Param('id') id: string, @Body() body: any) {
    const data = await this.financialService.updateServicePrice(id, body);
    return { success: true, data };
  }

  @Delete('service-prices/:id')
  async deleteServicePrice(@Param('id') id: string) {
    await this.financialService.deleteServicePrice(id);
    return { success: true };
  }

  // ── Transações ─────────────────────────────────────────────────────────────

  @Get('transactions')
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  async listTransactions(
    @Query() query: any,
    @Req() req: { user: { role: string; profileId?: string | null } },
  ) {
    const scopedClinicId = await this.financialService.resolveClinicId(
      req.user.role,
      req.user.profileId,
    );
    if (req.user.role !== 'ADMIN' && !scopedClinicId) {
      throw new ForbiddenException('Clinica da conta autenticada nao identificada.');
    }

    const data = await this.financialService.listTransactions({
      type: query.type,
      category: query.category,
      status: query.status,
      clinicId: scopedClinicId ?? query.clinicId,
      doctorId: query.doctorId,
      companyId: query.companyId,
      month: query.month !== undefined ? Number(query.month) : undefined,
      year: query.year !== undefined ? Number(query.year) : undefined,
    });
    return { success: true, data };
  }

  @Post('transactions')
  async createTransaction(@Body() body: any) {
    const data = await this.financialService.createTransaction(body);
    return { success: true, data };
  }

  @Patch('transactions/:id/pay')
  async markAsPaid(@Param('id') id: string) {
    const data = await this.financialService.markAsPaid(id);
    return { success: true, data };
  }

  // ── Resumo / Dashboard ─────────────────────────────────────────────────────

  @Get('summary')
  async getSummary(@Query('month') month: string, @Query('year') year: string) {
    const data = await this.financialService.getSummary(
      month !== undefined ? Number(month) : undefined,
      year !== undefined ? Number(year) : undefined,
    );
    return { success: true, data };
  }
}
