import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { QueueService } from './queue.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/queue')
@Roles('ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @Roles('ADMIN', 'DOCTOR')
  getQueue(
    @Query('doctorId') doctorId: string,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    const scopedDoctorId = req.user.role === 'DOCTOR' ? req.user.profileId : doctorId;
    return this.queueService.getQueueForDoctor(scopedDoctorId ?? '');
  }

  @Post('enqueue')
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  enqueue(@Body() body: { examRequestId: string }) {
    return this.queueService.enqueue(body.examRequestId);
  }

  @Post(':id/accept')
  @Roles('DOCTOR')
  accept(
    @Param('id') id: string,
    @Request() req: { user: { profileId?: string | null } },
  ) {
    return this.queueService.acceptPatient(id, req.user.profileId ?? '');
  }
}
