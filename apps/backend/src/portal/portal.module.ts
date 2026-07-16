import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret, getPortalJwtExpiresIn } from '../auth/jwt-secret';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalSessionGuard } from './portal-session.guard';
import { PrismaService } from '../prisma.service';
import { QueueModule } from '../queue/queue.module';
import { CompanyModule } from '../company/company.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getPortalJwtExpiresIn() as any },
    }),
    QueueModule,
    CompanyModule,
    PresenceModule,
  ],
  controllers: [PortalController],
  providers: [PortalService, PortalSessionGuard, PrismaService],
  exports: [PortalSessionGuard, JwtModule],
})
export class PortalModule {}
