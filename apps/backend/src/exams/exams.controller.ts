import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get('types')
  async listTypes() {
    const data = await this.examsService.findTypes();
    return { success: true, data };
  }

  @Public()
  @Get('required')
  async getRequired(@Query('cboCode') cboCode: string) {
    const data = await this.examsService.findRequiredByCbo(cboCode);
    return { success: true, data };
  }

  @Public()
  @Get('cbo-search')
  async searchCbo(@Query('q') query: string) {
    const data = await this.examsService.searchByFunctionName(query);
    return { success: true, data };
  }

  @Public()
  @Post()
  async create(@Body() body: {
    examRequestId: string;
    examType?: string;
    valueJson?: Record<string, any>;
    attachmentUrl?: string;
    results?: Array<{ examType: string; valueJson: Record<string, any>; attachmentUrl?: string }>;
  }) {
    const items = body.results ?? [{ examType: body.examType!, valueJson: body.valueJson!, attachmentUrl: body.attachmentUrl }];
    const created = await Promise.all(
      items.map(item => this.examsService.createExam(body.examRequestId, item.examType, item.valueJson, item.attachmentUrl))
    );
    return { success: true, data: created };
  }

  @Public()
  @Post(':id/send-to-queue')
  async sendToQueue(@Param('id') examRequestId: string) {
    await this.examsService.sendToMedicalQueue(examRequestId);
    return { success: true };
  }

  @Public()
  @Post('create-patient')
  async createPatient(@Body() body: {
    name: string;
    cpf: string;
    phone?: string;
    functionCboCode?: string;
    examPurpose: string;
    clinicId?: string;
    inviteId?: string;
  }) {
    const result = await this.examsService.createPatient(body);
    return { success: true, data: result };
  }
}
