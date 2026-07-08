import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, RolesGuard],
})
export class AdminModule {}
