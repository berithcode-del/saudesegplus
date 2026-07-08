import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { PrismaService } from '../prisma.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportGateway, PrismaService, WsJwtGuard],
  exports: [SupportService, SupportGateway],
})
export class SupportModule {}
