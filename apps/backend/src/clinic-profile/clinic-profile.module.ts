import { Module } from '@nestjs/common';
import { ClinicProfileController } from './clinic-profile.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ClinicProfileController],
  providers: [PrismaService],
  exports: [],
})
export class ClinicProfileModule {}