import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Public } from './auth/decorators/public.decorator';
import { DataEnvironment } from '@prisma/client';

@Controller('api')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('doctors')
  async getDoctors() {
    return this.prisma.doctor.findMany({
      where: { environment: DataEnvironment.REAL },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });
  }

  @Public()
  @Get('clinics')
  async getClinics() {
    return this.prisma.clinic.findMany({
      where: { environment: DataEnvironment.REAL },
    });
  }
}
