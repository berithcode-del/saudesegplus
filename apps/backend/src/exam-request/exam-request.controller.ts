import { Body, Controller, Get, Param, Patch, Query, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExamRequestService } from './exam-request.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/solicitacoes')
@Roles('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR')
export class ExamRequestController {
  constructor(private readonly examRequestService: ExamRequestService) {}

  // GET /api/solicitacoes?status=&companyId=&patientId=&page=1&limit=20
  @Get()
  async list(
    @Request() req: { user: { role: string; profileId?: string | null } },
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
      req.user,
    );
    return { success: true, data };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    const data = await this.examRequestService.findOne(id, req.user);
    return { success: true, data };
  }

  @Get('results/:resultId/attachment')
  async getAttachment(@Param('resultId') resultId: string, @Request() req: { user: { role: string; profileId?: string | null } }, @Res() response: Response) {
    const file = await this.examRequestService.getResultAttachment(resultId, req.user);
    response.setHeader('Content-Type', file.fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status: string; laudoTexto?: string; decision?: string; restrictionNotes?: string; doctorId?: string },
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    await this.examRequestService.assertAccess(id, req.user, true);
    const data = await this.examRequestService.updateStatus(id, body);
    return { success: true, data };
  }
}
