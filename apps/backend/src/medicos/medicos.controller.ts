import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { MedicosService } from './medicos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

interface AuthenticatedRequest {
  user: { sub: string };
}

@Controller('api/medicos')
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.medicosService.list(
      { search, city, state },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data };
  }

  @Get(':id/perfil')
  async getProfile(@Param('id') doctorId: string) {
    const data = await this.medicosService.getProfile(doctorId);
    return { success: true, data };
  }

  @Get(':id/solicitacoes')
  async listSolicitacoes(
    @Param('id') doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.medicosService.listSolicitacoes(
      doctorId,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/perfil')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Param('id') doctorId: string,
    @Body() body: UpdateDoctorProfileDto,
  ) {
    const data = await this.medicosService.updateProfile(
      req.user.sub,
      doctorId,
      body,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('signature-pin')
  async setSignaturePin(
    @Request() req: AuthenticatedRequest,
    @Body() body: { currentPassword: string; pin: string },
  ) {
    return this.medicosService.setSignaturePin(
      req.user.sub,
      body.currentPassword,
      body.pin,
    );
  }
}
