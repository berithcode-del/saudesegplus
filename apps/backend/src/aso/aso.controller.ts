import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AsoService } from './aso.service';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest {
  user: { sub: string };
}

@Controller('api/aso')
@UseGuards(JwtAuthGuard)
@Roles('DOCTOR')
export class AsoController {
  constructor(private readonly asoService: AsoService) {}

  @Post('generate')
  async generatePdf(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      examRequestId: string;
      decision: string;
      restrictionNotes?: string;
    },
  ) {
    const result = await this.asoService.generatePdf(
      body.examRequestId,
      req.user.sub,
      body.decision,
      body.restrictionNotes,
    );
    return { success: true, pdfUrl: result.pdfUrl };
  }
}
