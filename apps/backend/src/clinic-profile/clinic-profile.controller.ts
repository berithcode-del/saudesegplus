import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma.service'
import * as bcrypt from 'bcrypt'
import { randomInt } from 'crypto'
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { ClinicProfileService } from './clinic-profile.service'

@UseGuards(JwtAuthGuard)
@Controller('api/clinic')
@Roles('CLINIC', 'OPERATOR')
export class ClinicProfileController {
  constructor(
    private prisma: PrismaService,
    private clinicProfileService: ClinicProfileService,
  ) {}

  // GET /api/clinics?state=XX&city=YY — List clinics (public endpoint for company config)
  @Get('clinics')
  @Roles('CLINIC', 'COMPANY_ADMIN', 'ADMIN')
  async listClinics(@Query() query: { state: string; city?: string }) {
    const { state, city } = query;
    if (!state) return { success: true, data: [] };

    const where: any = { isActive: true, state };
    if (city) where.city = city;

    const clinics = await this.prisma.clinic.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        isMatriz: true,
        parentClinicId: true,
      },
      orderBy: [{ isMatriz: 'desc' }, { name: 'asc' }],
    });

    return { success: true, data: clinics };
  }

  // GET /api/clinic/profile — Get own profile data
  @Get('profile')
  @Roles('CLINIC', 'OPERATOR')
  async getProfile(@Request() req: any) {
    const userId = req.user.sub;
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { clinicProfile: true, operatorProfile: { include: { clinic: true } } },
    });
    const clinic = user?.clinicProfile ?? user?.operatorProfile?.clinic;
    if (!clinic) {
      return null;
    }
    return {
      id: clinic.id,
      name: clinic.name,
      cnpj: clinic.cnpj,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      phone: clinic.phone,
      contactEmail: clinic.contactEmail,
      email: user!.clinicProfile ? user!.email : null,
      operatorName: user!.operatorProfile?.name ?? null,
      operatorEmail: user!.operatorProfile ? user!.email : null,
    };
  }

  @Patch('profile')
  @Roles('CLINIC')
  async updateProfile(
    @Request() req: any,
    @Body() body: UpdateClinicProfileDto,
  ) {
    const userId = req.user.sub;
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { clinicProfile: true, operatorProfile: { select: { clinicId: true } } },
    });
    if (!user?.clinicProfile) {
      return { success: false, message: 'Perfil de clínica não encontrado' };
    }
    await this.prisma.clinic.update({
      where: { id: user.clinicProfile.id },
      data: {
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.contactEmail !== undefined
          ? { contactEmail: body.contactEmail }
          : {}),
      },
    });
    return { success: true };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async getOwnClinicId(userId: string): Promise<string | null> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { clinicProfile: true, operatorProfile: { select: { clinicId: true } } },
    });
    return user?.clinicProfile?.id ?? user?.operatorProfile?.clinicId ?? null;
  }

  // ─── Operators ───────────────────────────────────────────────────────────

  // GET /api/clinic/operators
  @Get('operators')
  @Roles('CLINIC')
  async listOperators(@Request() req: any) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId) return { success: true, data: [] };
    const operators = await this.prisma.operator.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        isActive: true,
        operationalPinHash: true,
        user: {
          select: { id: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { user: { email: 'asc' } },
    });
    return {
      success: true,
      data: operators.map(({ operationalPinHash, ...operator }) => ({
        ...operator,
        pinConfigured: Boolean(operationalPinHash),
      })),
    };
  }

  // POST /api/clinic/operators
  @Post('operators')
  @Roles('CLINIC')
  async createOperator(@Request() req: any, @Body() body: { name?: string }) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId)
      throw new NotFoundException('Perfil de clínica não encontrado');

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    const operatorName = body.name?.trim();
    if (!operatorName) {
      throw new BadRequestException('Nome do operador e obrigatorio');
    }

    const clinicSlug = clinic.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .replace(/^(.{0,20}).*/, '$1');

    const operatorCount = await this.prisma.operator.count({
      where: { clinicId },
    });
    const suffix = operatorCount + 1;

    const email = `operador${suffix}@${clinicSlug}.com`;

    const existingUser = await this.prisma.userAccount.findUnique({
      where: { email },
    });
    if (existingUser)
      throw new ConflictException('E-mail já cadastrado. Tente novamente.');

    const password = Math.random().toString(36).slice(-10);
    const operationalPin = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const passwordHash = await bcrypt.hash(password, 12);
    const operationalPinHash = await bcrypt.hash(operationalPin, 10);

    const user = await this.prisma.userAccount.create({
      data: {
        email,
        passwordHash,
        role: 'OPERATOR',
        operatorProfile: {
          create: { clinicId, name: operatorName, operationalPinHash },
        },
      },
      include: { operatorProfile: true },
    });

    return {
      success: true,
      data: {
        id: user.operatorProfile?.id,
        name: user.operatorProfile?.name,
        email: user.email,
        tempPassword: password,
        operationalPin,
      },
    };
  }

  // PATCH /api/clinic/operators/:id
  @Patch('operators/:id')
  @Roles('CLINIC')
  async updateOperator(
    @Request() req: any,
    @Param('id') operatorId: string,
    @Body() body: { email?: string; password?: string; operationalPin?: string; resetOperationalPin?: boolean },
  ) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId)
      throw new NotFoundException('Perfil de clínica não encontrado');

    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
      include: { user: true },
    });
    if (!operator || operator.clinicId !== clinicId) {
      throw new NotFoundException('Operador não encontrado');
    }

    if (body.email) {
      const email = String(body.email).trim().toLowerCase();
      const emailTaken = await this.prisma.userAccount.findFirst({
        where: { email, id: { not: operator.userId } },
      });
      if (emailTaken) throw new ConflictException('E-mail já cadastrado');
      await this.prisma.userAccount.update({
        where: { id: operator.userId },
        data: { email },
      });
    }

    if (body.password) {
      const passwordHash = await bcrypt.hash(body.password, 12);
      await this.prisma.userAccount.update({
        where: { id: operator.userId },
        data: { passwordHash },
      });
    }

    const nextOperationalPin = body.resetOperationalPin
      ? randomInt(0, 1_000_000).toString().padStart(6, '0')
      : body.operationalPin;
    if (nextOperationalPin) {
      if (!/^\d{6}$/.test(nextOperationalPin)) {
        throw new BadRequestException('O PIN operacional deve conter 6 digitos');
      }
      await this.prisma.operator.update({
        where: { id: operatorId },
        data: { operationalPinHash: await bcrypt.hash(nextOperationalPin, 10) },
      });
    }

    return { success: true, ...(body.resetOperationalPin ? { operationalPin: nextOperationalPin } : {}) };
  }

  @Get('doctors/available')
  @Roles('CLINIC')
  async availableDoctors(@Query('q') query = '') {
    const q = query.trim();
    return {
      success: true,
      data: await this.prisma.doctor.findMany({
        where: {
          verifiedAt: { not: null },
          ...(q
            ? { OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { crmNumber: { contains: q, mode: 'insensitive' } },
              ] }
            : {}),
        },
        select: { id: true, name: true, crmNumber: true, crmState: true },
        orderBy: { name: 'asc' },
        take: 30,
      }),
    };
  }

  @Get('doctors')
  @Roles('CLINIC')
  async listDoctors(@Request() req: any) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId) return { success: true, data: [] };
    const memberships = await this.prisma.clinicDoctor.findMany({
      where: { clinicId, active: true, endedAt: null },
      include: { doctor: true },
      orderBy: { doctor: { name: 'asc' } },
    });
    return {
      success: true,
      data: memberships.map(({ doctor, operationalPinHash, ...membership }) => ({
        ...membership,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          crmNumber: doctor.crmNumber,
          crmState: doctor.crmState,
          pinConfigured: Boolean(operationalPinHash),
        },
      })),
    };
  }

  @Post('doctors')
  @Roles('CLINIC')
  async associateDoctor(
    @Request() req: any,
    @Body() body: { doctorId: string; operationalPin?: string },
  ) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId) throw new NotFoundException('Perfil de clinica nao encontrado');
    const doctor = await this.prisma.doctor.findUnique({ where: { id: body.doctorId } });
    if (!doctor?.verifiedAt) throw new NotFoundException('Medico verificado nao encontrado');
    const operationalPin = body.operationalPin || randomInt(0, 1_000_000).toString().padStart(6, '0');
    if (!/^\d{6}$/.test(operationalPin)) {
      throw new BadRequestException('O PIN operacional deve conter 6 digitos');
    }
    const operationalPinHash = await bcrypt.hash(operationalPin, 10);
    await this.prisma.clinicDoctor.upsert({
        where: { clinicId_doctorId: { clinicId, doctorId: doctor.id } },
        create: { clinicId, doctorId: doctor.id, operationalPinHash },
        update: { active: true, endedAt: null, operationalPinHash },
      });
    return { success: true, data: { doctorId: doctor.id, operationalPin } };
  }

  @Delete('doctors/:doctorId')
  @Roles('CLINIC')
  async removeDoctor(@Request() req: any, @Param('doctorId') doctorId: string) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId) throw new NotFoundException('Perfil de clinica nao encontrado');
    const updated = await this.prisma.clinicDoctor.updateMany({
      where: { clinicId, doctorId, active: true },
      data: { active: false, endedAt: new Date() },
    });
    if (!updated.count) throw new NotFoundException('Vinculo medico nao encontrado');
    return { success: true };
  }

  // DELETE /api/clinic/operators/:id
  @Delete('operators/:id')
  @Roles('CLINIC')
  async deleteOperator(@Request() req: any, @Param('id') operatorId: string) {
    const clinicId = await this.getOwnClinicId(req.user.sub);
    if (!clinicId)
      throw new NotFoundException('Perfil de clínica não encontrado');

    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });
    if (!operator || operator.clinicId !== clinicId) {
      throw new NotFoundException('Operador não encontrado');
    }

    const examResultsCount = await this.prisma.examResult.count({
      where: { collectedById: operatorId },
    });
    if (examResultsCount > 0) {
      throw new BadRequestException(
        'Não é possível remover um operador que já registrou exames. Atribua os registros a outro operador antes de remover.',
      );
    }

    const userId = operator.userId;
    await this.prisma.operator.delete({ where: { id: operatorId } });
    await this.prisma.userAccount.delete({ where: { id: userId } });

    return { success: true };
  }

  // ─── ASOs da Clínica ────────────────────────────────────────────────────────

  // GET /api/clinic/asos — Lista ASOs emitidos pela clínica
  @Get('asos')
  @Roles('CLINIC', 'OPERATOR')
  async listClinicAsos(@Request() req: any) {
    try {
      const asos = await this.clinicProfileService.listClinicAsos(req.user.sub);
      return { success: true, data: asos };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { success: false, message: error.message };
      }
      throw error;
    }
  }

  // GET /api/clinic/asos/:asoId/file — Download/visualização protegida do PDF
  @Get('asos/:asoId/file')
  @Roles('CLINIC', 'OPERATOR')
  async getClinicAsoFile(@Request() req: any, @Param('asoId') asoId: string, @Res() response: Response) {
    try {
      const file = await this.clinicProfileService.getClinicAsoPdf(req.user.sub, asoId);
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      response.send(file.buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        response.status(404).send({ success: false, message: error.message });
      } else {
        throw error;
      }
    }
  }
}
