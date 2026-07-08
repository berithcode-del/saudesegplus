import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { PrismaService } from '../prisma.service';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [CompanyModule, AuthModule, PresenceModule],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, PrismaService, WsJwtGuard],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
