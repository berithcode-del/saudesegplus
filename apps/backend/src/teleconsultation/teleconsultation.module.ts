import { Module } from '@nestjs/common';
import { TeleconsultationController } from './teleconsultation.controller';
import { PrismaService } from '../prisma.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [TeleconsultationController],
  providers: [PrismaService],
})
export class TeleconsultationModule {}
