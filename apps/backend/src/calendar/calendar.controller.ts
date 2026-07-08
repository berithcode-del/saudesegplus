import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Public()
  @Get()
  async list(
    @Query('ownerType') ownerType: string,
    @Query('ownerId') ownerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.calendarService.listEvents(ownerType, ownerId, startDate, endDate);
    return { success: true, data };
  }

  @Public()
  @Post()
  async create(@Body() body: any) {
    const data = await this.calendarService.createEvent(body);
    return { success: true, data };
  }

  @Public()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.calendarService.updateEvent(id, body);
    return { success: true, data };
  }

  @Public()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.calendarService.deleteEvent(id);
    return { success: true, message: 'Event deleted successfully' };
  }
}
