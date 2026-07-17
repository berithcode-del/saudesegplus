import { Module } from '@nestjs/common';
import { AsoProtocoloController } from './aso-protocolo.controller';
import { AsoProtocoloService } from './aso-protocolo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AsoProtocoloController],
  providers: [AsoProtocoloService, PrismaService],
  exports: [AsoProtocoloService],
})
export class AsoProtocoloModule {}