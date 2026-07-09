import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { AnamneseService } from './anamnese.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/anamnese')
@Roles('ADMIN', 'DOCTOR')
export class AnamneseController {
  constructor(private readonly anamneseService: AnamneseService) {}

  @Get(':patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.anamneseService.findByPatient(patientId);
    return { success: true, data };
  }

  @Put(':patientId')
  async upsert(
    @Param('patientId') patientId: string,
    @Body() body: {
      queixas?: string;
      historicoOcupacional?: string;
      historicoMedico?: string;
      medicamentos?: string;
      habitos?: string;
    },
  ) {
    const data = await this.anamneseService.upsert(patientId, body);
    return { success: true, data };
  }
}
