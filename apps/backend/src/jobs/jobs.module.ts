import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { JobsService } from './jobs.service';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ScheduleModule.forRoot(), CompanyModule, AuthModule, MailModule],
  providers: [JobsService, PrismaService],
})
export class JobsModule {}
