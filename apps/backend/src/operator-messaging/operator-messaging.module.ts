import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OperatorMessagingController } from './operator-messaging.controller';
import { OperatorMessagingService } from './operator-messaging.service';

@Module({
  controllers: [OperatorMessagingController],
  providers: [OperatorMessagingService, PrismaService],
})
export class OperatorMessagingModule {}
