import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { QueueModule } from './queue/queue.module';
import { ExamsModule } from './exams/exams.module';
import { SignatureModule } from './signature/signature.module';
import { AsoModule } from './aso/aso.module';
import { CompanyModule } from './company/company.module';
import { ColaboradorModule } from './colaborador/colaborador.module';
import { ExamRequestModule } from './exam-request/exam-request.module';
import { MedicosModule } from './medicos/medicos.module';
import { AnamneseModule } from './anamnese/anamnese.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { PortalModule } from './portal/portal.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { JobsModule } from './jobs/jobs.module';
import { CalendarModule } from './calendar/calendar.module';
import { TeleconsultationModule } from './teleconsultation/teleconsultation.module';
import { FinancialModule } from './financial/financial.module';
import { SupportModule } from './support/support.module';
import { ClinicProfileModule } from './clinic-profile/clinic-profile.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    QueueModule,
    ExamsModule,
    SignatureModule,
    AsoModule,
    CompanyModule,
    ColaboradorModule,
    ExamRequestModule,
    MedicosModule,
    AnamneseModule,
    UploadModule,
    AuthModule,
    PortalModule,
    AdminModule,
    MailModule,
    JobsModule,
    CalendarModule,
    TeleconsultationModule,
    FinancialModule,
    SupportModule,
    ClinicProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
