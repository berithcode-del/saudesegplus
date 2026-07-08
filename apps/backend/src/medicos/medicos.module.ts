import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MedicosController } from './medicos.controller';
import { MedicosService } from './medicos.service';

@Module({
  controllers: [MedicosController],
  providers: [MedicosService, PrismaService],
})
export class MedicosModule {}
