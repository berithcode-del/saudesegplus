import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AnamneseController } from './anamnese.controller';
import { AnamneseService } from './anamnese.service';

@Module({
  controllers: [AnamneseController],
  providers: [AnamneseService, PrismaService],
})
export class AnamneseModule {}
