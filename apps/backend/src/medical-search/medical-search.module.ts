import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MedicalSearchController } from './medical-search.controller';
import { MedicalSearchService } from './medical-search.service';

@Module({
  controllers: [MedicalSearchController],
  providers: [MedicalSearchService, PrismaService],
})
export class MedicalSearchModule {}
