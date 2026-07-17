import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClinicProfileController } from './clinic-profile.controller';
import { ClinicProfileService } from './clinic-profile.service';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../upload/supabase-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [ClinicProfileController],
  providers: [ClinicProfileService, PrismaService, SupabaseStorageService],
  exports: [ClinicProfileService],
})
export class ClinicProfileModule {}