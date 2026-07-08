import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ColaboradorService } from './colaborador.service';
import { ValidateInviteDto } from './dto/validate-invite.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @Public()
  @Post()
  async validateInviteAndRegister(@Body() dto: ValidateInviteDto) {
    // Erros (404 para convite inexistente, 400 para regra de negócio)
    // agora propagam com o status correto — antes tudo virava 400.
    const result = await this.colaboradorService.validateInviteAndRegister(
      dto,
    );
    return { success: true, data: result };
  }

  // GET /api/colaboradores/:id/solicitacoes — usado pelo EmployeeDashboard
  // para o colaborador acompanhar o status da própria solicitação
  // (F2-REQ-015). Esse endpoint não existia.
  @Public()
  @Get(':id/solicitacoes')
  async listSolicitacoes(@Param('id') patientId: string) {
    const solicitacoes = await this.colaboradorService.listSolicitacoes(
      patientId,
    );
    return { success: true, data: solicitacoes };
  }
}
