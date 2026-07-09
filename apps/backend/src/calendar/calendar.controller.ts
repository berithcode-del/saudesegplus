import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/calendar')
@Roles('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async list(
    @Query('ownerType') ownerType: string,
    @Query('ownerId') ownerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: { user: { role: string; profileId?: string | null } },
  ) {
    await this.calendarService.assertOwnerAccess(ownerType, ownerId, req!.user);
    const data = await this.calendarService.listEvents(ownerType, ownerId, startDate, endDate);
    return { success: true, data };
  }

  @Post()
  async create(
    @Body() body: any,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    await this.calendarService.assertOwnerAccess(body.ownerType, body.ownerId, req.user);
    const data = await this.calendarService.createEvent(body);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    await this.calendarService.assertEventAccess(id, req.user);
    const data = await this.calendarService.updateEvent(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { role: string; profileId?: string | null } },
  ) {
    await this.calendarService.assertEventAccess(id, req.user);
    await this.calendarService.deleteEvent(id);
    return { success: true, message: 'Event deleted successfully' };
  }
}
