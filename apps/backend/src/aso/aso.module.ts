import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AsoController } from './aso.controller';
import { AsoService } from './aso.service';
import { FinancialModule } from '../financial/financial.module';
import { UploadModule } from '../upload/upload.module';
import { AsoProtocoloModule } from '../aso-protocolo/aso-protocolo.module';

@Module({
  imports: [FinancialModule, UploadModule, AsoProtocoloModule],
  controllers: [AsoController],
  providers: [AsoService, PrismaService],
})
export class AsoModule {}
