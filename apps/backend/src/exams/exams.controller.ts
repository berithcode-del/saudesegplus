import { Controller, Post, Get, Body, Param, Query, Request } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('api/exams')
@Roles('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('types')
  async listTypes() {
    const data = await this.examsService.findTypes();
    return { success: true, data };
  }

  @Get('required')
  async getRequired(@Query('cboCode') cboCode: string) {
    const data = await this.examsService.findRequiredByCbo(cboCode);
    return { success: true, data };
  }

  @Get('cbo-search')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async searchCbo(@Query('q') query: string) {
    const data = await this.examsService.searchByFunctionName(query);
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  async create(
    @Body()
    body: {
      examRequestId: string;
      examType?: string;
      valueJson?: Record<string, any>;
      attachmentUrl?: string;
      operatorId?: string;
      results?: Array<{
        examType: string;
        valueJson: Record<string, any>;
        attachmentUrl?: string;
      }>;
    },
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    const items = body.results ?? [
      {
        examType: body.examType!,
        valueJson: body.valueJson!,
        attachmentUrl: body.attachmentUrl,
      },
    ];
    const created = await Promise.all(
      items.map((item) =>
        this.examsService.createExam(
          body.examRequestId,
          item.examType,
          item.valueJson,
          item.attachmentUrl,
          req.user,
          body.operatorId,
        ),
      ),
    );
    return { success: true, data: created };
  }

  @Post(':id/send-to-queue')
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  async sendToQueue(@Param('id') examRequestId: string) {
    await this.examsService.sendToMedicalQueue(examRequestId);
    return { success: true };
  }

  @Post('create-patient')
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  async createPatient(
    @Body()
    body: {
      name: string;
      cpf: string;
      phone?: string;
      functionCboCode?: string;
      examPurpose: string;
      clinicId?: string;
      inviteId?: string;
      paymentId: string;
    },
  ) {
    const result = await this.examsService.createPatient(body);
    return { success: true, data: result };
  }
}
