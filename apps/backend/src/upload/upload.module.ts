import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from '../prisma.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PortalModule } from '../portal/portal.module';

@Module({
  imports: [
    MulterModule.register(),
    PortalModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, PrismaService],
})
export class UploadModule {}
