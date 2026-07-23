import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SignatureService } from './signature.service';

interface AuthenticatedRequest {
  user: { sub: string };
}

@Controller('api/signature')
@UseGuards(JwtAuthGuard)
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  @Post('generate')
  async generateLink(
    @Request() req: AuthenticatedRequest,
    @Body() body: { examRequestId: string },
  ) {
    const result = await this.signatureService.generateLink(
      body.examRequestId,
      req.user.sub,
    );
    return { success: true, ...result };
  }

  @Post('sign/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signDocument(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { pin: string },
  ) {
    return this.signatureService.signDocument(id, req.user.sub, body.pin);
  }

  @Post('certificate/register')
  async registerCertificate(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      providerName?: string;
      certificateThumbprint: string;
      certificateSubjectDN: string;
      issuerDN: string;
      validFrom: string;
      validUntil: string;
    },
  ) {
    return this.signatureService.registerCertificate(req.user.sub, body);
  }

  @Get('certificate')
  async listCertificates(@Request() req: AuthenticatedRequest) {
    return this.signatureService.listCertificates(req.user.sub);
  }

  @Delete('certificate/:id')
  async revokeCertificate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.signatureService.revokeCertificate(req.user.sub, id);
  }

  @Get('verify/:id')
  @Public()
  async verify(@Param('id') id: string) {
    return this.signatureService.verifyAsoDocument(id);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Body() payload: { document_id: string; signed_at: string },
    @Headers('x-signature-webhook-secret') webhookSecret?: string,
  ) {
    return this.signatureService.handleWebhook(payload, webhookSecret);
  }
}
