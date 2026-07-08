import {
  Body,
  Controller,
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

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Body() payload: { document_id: string; signed_at: string },
    @Headers('x-signature-webhook-secret') webhookSecret?: string,
  ) {
    return this.signatureService.handleWebhook(payload, webhookSecret);
  }
}
