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
    @Request() req: { user: { role: string; profileId?: string | null; workspaceClinicId?: string | null } },
  ) {
    const scopedDoctorId = req.user.role === 'DOCTOR' ? req.user.profileId : doctorId;
    return this.queueService.getQueueForDoctor(scopedDoctorId ?? '', req.user.workspaceClinicId);
  }

  @Post('enqueue')
  @Roles('ADMIN')
  enqueue(@Body() body: { examRequestId: string }) {
    return this.queueService.enqueue(body.examRequestId);
  }

  @Post(':id/accept')
  @Roles('DOCTOR')
  accept(
    @Param('id') id: string,
    @Request() req: { user: { profileId?: string | null; workspaceClinicId?: string | null } },
  ) {
    return this.queueService.acceptPatient(id, req.user.profileId ?? '', req.user.workspaceClinicId);
  }
}
