import { Module } from '@nestjs/common';
import { ClinicProfileController } from './clinic-profile.controller';
import { ClinicProfileService } from './clinic-profile.service';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service';

@Module({
  controllers: [ClinicProfileController],
  providers: [ClinicProfileService, PrismaService, SupabaseStorageService],
  exports: [ClinicProfileService],
})
export class ClinicProfileModule {}