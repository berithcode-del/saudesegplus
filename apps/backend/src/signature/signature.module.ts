import { Module } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SignatureController],
  providers: [SignatureService, PrismaService],
})
export class SignatureModule {}
