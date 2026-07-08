import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ExamRequestService } from './exam-request.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/solicitacoes')
export class ExamRequestController {
  constructor(private readonly examRequestService: ExamRequestService) {}

  @Public()
  // GET /api/solicitacoes?status=&companyId=&patientId=&page=1&limit=20
  @Get()
  async list(
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.examRequestService.list(
      { status, companyId, patientId },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.examRequestService.findOne(id);
    return { success: true, data };
  }

  @Public()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status: string; laudoTexto?: string; decision?: string; restrictionNotes?: string; doctorId?: string },
  ) {
    const data = await this.examRequestService.updateStatus(id, body);
    return { success: true, data };
  }
}
