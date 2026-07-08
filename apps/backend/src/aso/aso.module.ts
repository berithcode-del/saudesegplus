import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AsoController } from './aso.controller';
import { AsoService } from './aso.service';
import { MailModule } from '../mail/mail.module';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [MailModule, FinancialModule],
  controllers: [AsoController],
  providers: [AsoService, PrismaService],
})
export class AsoModule {}
