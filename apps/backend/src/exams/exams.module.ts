import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { CompanyGateway } from '../company/company.gateway';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [QueueModule, AuthModule],
  controllers: [ExamsController],
  providers: [ExamsService, PrismaService, CompanyGateway],
})
export class ExamsModule {}
