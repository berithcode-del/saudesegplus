import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Body() dto: CreateTicketDto, @Req() req: any) {
    try {
      const result = await this.supportService.createTicket(dto, req.user);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('tickets')
  async listUserTickets(@Req() req: any) {
    try {
      const result = await this.supportService.listUserTickets(req.user.sub);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') id: string, @Req() req: any) {
    try {
      const result = await this.supportService.getTicket(id, req.user.sub);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('tickets/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.supportService.sendMessage(id, dto, req.user, 'USER');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Get('admin/tickets')
  async listAllTickets(@Req() req: any, @Query('status') status?: string) {
    try {
      if (req.user.role !== 'ADMIN') {
        return { success: false, message: 'Acesso restrito a administradores' };
      }
      const result = await this.supportService.listAllTickets(status);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('admin/tickets/:id')
  async getAdminTicket(@Param('id') id: string, @Req() req: any) {
    try {
      if (req.user.role !== 'ADMIN') {
        return { success: false, message: 'Acesso restrito a administradores' };
      }
      const result = await this.supportService.getAdminTicket(id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('admin/tickets/:id/messages')
  async sendAdminMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    try {
      if (req.user.role !== 'ADMIN') {
        return { success: false, message: 'Acesso restrito a administradores' };
      }
      const result = await this.supportService.sendAdminMessage(id, dto, req.user);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Patch('admin/tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    try {
      if (req.user.role !== 'ADMIN') {
        return { success: false, message: 'Acesso restrito a administradores' };
      }
      const result = await this.supportService.updateStatus(id, body.status);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
