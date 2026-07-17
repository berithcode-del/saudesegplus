import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AsoController } from './aso.controller';
import { AsoService } from './aso.service';
import { FinancialModule } from '../financial/financial.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [FinancialModule, UploadModule],
  controllers: [AsoController],
  providers: [AsoService, PrismaService],
})
export class AsoModule {}
