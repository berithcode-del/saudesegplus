import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentFlow, PriceItemCategory } from '@prisma/client';
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
  async updateConfig(
    @Body()
    body: {
      defaultClinicFeePercent?: number;
      defaultDoctorFeePercent?: number;
      defaultPlatformFeePercent?: number;
    },
  ) {
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
  async createServicePrice(
    @Body()
    body: {
      name: string;
      description?: string;
      basePrice: number;
      clinicFeePercent: number;
      doctorFeePercent: number;
      platformFeePercent: number;
    },
  ) {
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

  @Get('exam-item-prices')
  async listExamItemPrices() {
    const data = await this.financialService.listExamItemPrices();
    return { success: true, data };
  }

  @Post('exam-item-prices')
  async createExamItemPrice(
    @Body()
    body: {
      code: string;
      name: string;
      category: PriceItemCategory;
      amount: number;
      clinicFeePercent?: number;
      doctorFeePercent?: number;
      platformFeePercent?: number;
    },
  ) {
    const data = await this.financialService.createExamItemPrice(body);
    return { success: true, data };
  }

  @Patch('exam-item-prices/:id')
  async updateExamItemPrice(@Param('id') id: string, @Body() body: any) {
    const data = await this.financialService.updateExamItemPrice(id, body);
    return { success: true, data };
  }

  @Post('quotes')
  @Roles('ADMIN', 'COMPANY_ADMIN', 'OPERATOR', 'DOCTOR')
  async quote(
    @Body()
    body: {
      cboCode?: string;
      examPurpose?: string;
      specialClearances?: string[];
    },
  ) {
    const data = await this.financialService.quote(body);
    return { success: true, data };
  }

  @Post('payments')
  @Roles('ADMIN', 'COMPANY_ADMIN', 'CLINIC', 'OPERATOR')
  async createPayment(
    @Body()
    body: {
      flow: PaymentFlow;
      companyId?: string;
      clinicId?: string;
      method?: string;
      cboCode?: string;
      examPurpose?: string;
      specialClearances?: string[];
      checkoutPayload?: Record<string, unknown>;
      externalId?: string;
    },
    @Req() req: { user: { role: string; profileId?: string | null; workspaceClinicId?: string | null } },
  ) {
    const input = { ...body };
    if (req.user.role === 'COMPANY_ADMIN') {
      if (input.flow !== PaymentFlow.COMPANY_INVITE) {
        throw new ForbiddenException(
          'Empresa pode criar apenas pagamentos de convites.',
        );
      }
      input.companyId = req.user.profileId ?? undefined;
      input.clinicId = undefined;
    }
    if (['OPERATOR', 'DOCTOR'].includes(req.user.role)) {
      if (input.flow !== PaymentFlow.CLINIC_WALK_IN) {
        throw new ForbiddenException(
          'Clinica pode criar apenas pagamentos presenciais.',
        );
      }
      input.clinicId =
        (await this.financialService.resolveClinicId(
          req.user.role,
          req.user.profileId,
          req.user.workspaceClinicId,
        )) ?? undefined;
    }
    const data = await this.financialService.createPayment(input);
    return { success: true, data };
  }

  @Patch('payments/:id/confirm')
  @Roles('ADMIN', 'COMPANY_ADMIN', 'OPERATOR', 'DOCTOR')
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { method?: string },
    @Req() req: { user: { role: string; profileId?: string | null; workspaceClinicId?: string | null } },
  ) {
    await this.financialService.assertPaymentAccess(id, req.user);
    const data = await this.financialService.confirmPayment(id, body.method);
    return { success: true, data };
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
      throw new ForbiddenException(
        'Clinica da conta autenticada nao identificada.',
      );
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
