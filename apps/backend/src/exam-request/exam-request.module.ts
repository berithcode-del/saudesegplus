import { Module } from '@nestjs/common';
import { ExamRequestController } from './exam-request.controller';
import { ExamRequestService } from './exam-request.service';
import { PrismaService } from '../prisma.service';
import { CompanyModule } from '../company/company.module';
import { PresenceModule } from '../presence/presence.module';
import { UploadModule } from '../upload/upload.module';
import { AsoProtocoloModule } from '../aso-protocolo/aso-protocolo.module';

@Module({
  imports: [CompanyModule, PresenceModule, UploadModule, AsoProtocoloModule],
  controllers: [ExamRequestController],
  providers: [ExamRequestService, PrismaService],
})
export class ExamRequestModule {}
