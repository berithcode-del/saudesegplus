import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ── Configuração global ────────────────────────────────────────────────────

  @Public()
  @Get('config')
  async getConfig() {
    const data = await this.financialService.getConfig();
    return { success: true, data };
  }

  @Public()
  @Patch('config')
  async updateConfig(@Body() body: { defaultClinicFeePercent?: number; defaultDoctorFeePercent?: number; defaultPlatformFeePercent?: number }) {
    const data = await this.financialService.updateConfig(body);
    return { success: true, data };
  }

  // ── Preços de serviço ─────────────────────────────────────────────────────

  @Public()
  @Get('service-prices')
  async listServicePrices() {
    const data = await this.financialService.listServicePrices();
    return { success: true, data };
  }

  @Public()
  @Post('service-prices')
  async createServicePrice(@Body() body: { name: string; description?: string; basePrice: number; clinicFeePercent: number; doctorFeePercent: number; platformFeePercent: number }) {
    const data = await this.financialService.createServicePrice(body);
    return { success: true, data };
  }

  @Public()
  @Patch('service-prices/:id')
  async updateServicePrice(@Param('id') id: string, @Body() body: any) {
    const data = await this.financialService.updateServicePrice(id, body);
    return { success: true, data };
  }

  @Public()
  @Delete('service-prices/:id')
  async deleteServicePrice(@Param('id') id: string) {
    await this.financialService.deleteServicePrice(id);
    return { success: true };
  }

  // ── Transações ─────────────────────────────────────────────────────────────

  @Public()
  @Get('transactions')
  async listTransactions(@Query() query: any) {
    const data = await this.financialService.listTransactions({
      type: query.type,
      category: query.category,
      status: query.status,
      clinicId: query.clinicId,
      doctorId: query.doctorId,
      companyId: query.companyId,
      month: query.month !== undefined ? Number(query.month) : undefined,
      year: query.year !== undefined ? Number(query.year) : undefined,
    });
    return { success: true, data };
  }

  @Public()
  @Post('transactions')
  async createTransaction(@Body() body: any) {
    const data = await this.financialService.createTransaction(body);
    return { success: true, data };
  }

  @Public()
  @Patch('transactions/:id/pay')
  async markAsPaid(@Param('id') id: string) {
    const data = await this.financialService.markAsPaid(id);
    return { success: true, data };
  }

  // ── Resumo / Dashboard ─────────────────────────────────────────────────────

  @Public()
  @Get('summary')
  async getSummary(@Query('month') month: string, @Query('year') year: string) {
    const data = await this.financialService.getSummary(
      month !== undefined ? Number(month) : undefined,
      year !== undefined ? Number(year) : undefined,
    );
    return { success: true, data };
  }
}
