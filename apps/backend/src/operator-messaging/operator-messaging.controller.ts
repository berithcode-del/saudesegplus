import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { OperatorMessagingService } from './operator-messaging.service';

@Controller('api/operator-messaging')
@UseGuards(JwtAuthGuard)
export class OperatorMessagingController {
  constructor(private readonly operatorMessagingService: OperatorMessagingService) {}

  @Get('recipients')
  async recipients(@Request() req: { user: JwtPayload }, @Query('q') q = '') {
    return this.operatorMessagingService.listRecipients(req.user, q);
  }

  @Get('conversations')
  async conversations(@Request() req: { user: JwtPayload }) {
    return this.operatorMessagingService.listConversations(req.user);
  }

  @Post('conversations')
  async createConversation(
    @Request() req: { user: JwtPayload },
    @Body() body: { participantIds: string[]; title?: string },
  ) {
    return this.operatorMessagingService.createConversation(req.user, body.participantIds ?? [], body.title, false);
  }

  @Post('conversations/group')
  async createGroup(
    @Request() req: { user: JwtPayload },
    @Body() body: { participantIds: string[]; title: string },
  ) {
    return this.operatorMessagingService.createConversation(req.user, body.participantIds ?? [], body.title, true);
  }

  @Get('conversations/:id/messages')
  async messages(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.operatorMessagingService.listMessages(req.user, id);
  }

  @Post('conversations/:id/messages')
  async send(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: { content: string; attachments?: string[] },
  ) {
    return this.operatorMessagingService.sendMessage(req.user, id, body.content ?? '', body.attachments ?? []);
  }

  @Get('notifications')
  async notifications(@Request() req: { user: JwtPayload }, @Query('unreadOnly') unreadOnly?: string) {
    return this.operatorMessagingService.listNotifications(req.user, unreadOnly === 'true');
  }

  @Post('notifications/:id/read')
  async read(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.operatorMessagingService.markNotificationRead(req.user, id);
  }
}
