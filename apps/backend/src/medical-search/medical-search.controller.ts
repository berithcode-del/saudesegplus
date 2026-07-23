import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { MedicalSearchService } from './medical-search.service';

@Controller('api/medical')
@UseGuards(JwtAuthGuard)
@Roles('DOCTOR')
export class MedicalSearchController {
  constructor(private readonly medicalSearchService: MedicalSearchService) {}

  @Get('search')
  async search(
    @Request() req: { user: JwtPayload },
    @Query('q') q = '',
    @Query('limit') limit?: string,
  ) {
    return this.medicalSearchService.search(req.user, q, limit ? Number(limit) : 5);
  }
}
