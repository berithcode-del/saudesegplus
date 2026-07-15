import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { PortalModule } from '../portal/portal.module';

@Module({
  imports: [MulterModule.register(), ConfigModule, PortalModule],
  controllers: [UploadController],
  providers: [UploadService, SupabaseStorageService, PrismaService],
  exports: [UploadService, SupabaseStorageService],
})
export class UploadModule {}
