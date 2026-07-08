import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Public()
  @Get()
  getQueue(@Query('doctorId') doctorId: string) {
    return this.queueService.getQueueForDoctor(doctorId);
  }

  @Public()
  @Post('enqueue')
  enqueue(@Body() body: { examRequestId: string }) {
    return this.queueService.enqueue(body.examRequestId);
  }

  @Public()
  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() body: { doctorId: string }) {
    return this.queueService.acceptPatient(id, body.doctorId);
  }
}
