import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller('api')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('doctors')
  async getDoctors() {
    return this.prisma.doctor.findMany({ include: { user: { select: { id: true, email: true, role: true } } } });
  }

  @Public()
  @Get('clinics')
  async getClinics() {
    return this.prisma.clinic.findMany();
  }
}
