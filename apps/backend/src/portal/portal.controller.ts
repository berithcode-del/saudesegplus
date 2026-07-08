import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PortalService } from './portal.service';
import { PortalSessionGuard, PortalUser } from './portal-session.guard';
import { AuthPortalDto } from './dto/auth-portal.dto';
import { ConfirmarDadosDto } from './dto/confirmar-dados.dto';
import { QuestionarioDto } from './dto/questionario.dto';
import { EnviarDocumentoDto } from './dto/enviar-documento.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PresenceService } from '../presence/presence.service';

@Controller('api/portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly presenceService: PresenceService,
  ) {}

  @Public()
  @Post('heartbeat')
  @UseGuards(PortalSessionGuard)
  async heartbeat(@Req() req: Request) {
    const user = (req as any).user as PortalUser;
    this.presenceService.recordHeartbeat(user.processId);
    return { success: true };
  }

  @Public()
  @Get('preview/:token')
  async preview(@Param('token') token: string) {
    return this.portalService.preview(token);
  }

  @Public()
  @Post('auth')
  async auth(@Body() dto: AuthPortalDto) {
    return this.portalService.auth(dto.token, dto.cpf, dto.birthDate);
  }

  @Public()
  @Get('processo')
  @UseGuards(PortalSessionGuard)
  async getProcesso(@Req() req: Request) {
    const user = (req as any).user as PortalUser;
    return this.portalService.getProcesso(user.patientId, user.processId);
  }

  @Public()
  @Post('confirmar-dados')
  @UseGuards(PortalSessionGuard)
  async confirmarDados(@Req() req: Request, @Body() dto: ConfirmarDadosDto) {
    const user = (req as any).user as PortalUser;
    return this.portalService.confirmarDados(user.processId, user.patientId, dto.phone, dto.email);
  }

  @Public()
  @Post('documentos')
  @UseGuards(PortalSessionGuard)
  async enviarDocumento(@Req() req: Request, @Body() dto: EnviarDocumentoDto) {
    const user = (req as any).user as PortalUser;
    return this.portalService.enviarDocumento(user.processId, user.patientId, dto.tipo, dto.fileUrl);
  }

  @Public()
  @Post('questionario')
  @UseGuards(PortalSessionGuard)
  async responderQuestionario(@Req() req: Request, @Body() dto: QuestionarioDto) {
    const user = (req as any).user as PortalUser;
    return this.portalService.responderQuestionario(user.processId, user.patientId, dto);
  }

  @Public()
  @Get('aso')
  @UseGuards(PortalSessionGuard)
  async getAso(@Req() req: Request) {
    const user = (req as any).user as PortalUser;
    return this.portalService.getAso(user.processId, user.patientId);
  }
}
