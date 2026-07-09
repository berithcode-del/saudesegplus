import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { paginate, PaginatedResult } from '../common/pagination';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@Injectable()
export class MedicosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filters: { search?: string; city?: string; state?: string },
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.DoctorWhereInput = {
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { crmNumber: { contains: filters.search, mode: 'insensitive' } },
            { specialties: { contains: filters.search, mode: 'insensitive' } },
          ]
        : undefined,
      city: filters.city,
      state: filters.state,
      verifiedAt: { not: null },
    };
    return paginate(this.prisma.doctor, page, limit, {
      where,
      select: {
        id: true,
        name: true,
        crmNumber: true,
        crmState: true,
        city: true,
        state: true,
        specialties: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProfile(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        crmNumber: true,
        crmState: true,
        city: true,
        state: true,
        specialties: true,
        status: true,
        verifiedAt: true,
        rqeNumber: true,
        phone: true,
        contactEmail: true,
        user: { select: { email: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    return {
      ...doctor,
      email: doctor.user?.email ?? null,
    };
  }

  async updateProfile(
    userId: string,
    doctorId: string,
    body: UpdateDoctorProfileDto,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    if (doctor.userId !== userId)
      throw new ForbiddenException('Você só pode editar seu próprio perfil');

    const updateData: Prisma.DoctorUpdateInput = {};
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.contactEmail !== undefined) {
      updateData.contactEmail = body.contactEmail.trim().toLowerCase();
    }

    const updated = await this.prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
    });
    return updated;
  }

  async setSignaturePin(userId: string, currentPassword: string, pin: string) {
    if (!currentPassword) {
      throw new BadRequestException('Informe sua senha atual');
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('O PIN deve conter exatamente 4 dígitos');
    }

    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { doctorProfile: true },
    });
    if (!user?.doctorProfile) {
      throw new UnauthorizedException('Perfil médico não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    await this.prisma.doctor.update({
      where: { id: user.doctorProfile.id },
      data: { signaturePin: await bcrypt.hash(pin, 10) },
    });

    return {
      success: true,
      message: 'PIN de assinatura cadastrado com sucesso',
    };
  }

  async listSolicitacoes(
    doctorId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    const whereQueue: Prisma.QueueEntryWhereInput = {
      assignedDoctorId: doctorId,
    };

    if (startDate || endDate) {
      whereQueue.assignedAt = {};
      if (startDate) {
        whereQueue.assignedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereQueue.assignedAt.lte = new Date(endDate);
      }
    }

    const queueEntries = await this.prisma.queueEntry.findMany({
      where: whereQueue,
      include: {
        request: {
          include: {
            patient: true,
            clinic: true,
            invite: { include: { company: true } },
            results: { include: { type: true } },
            asoDocuments: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return queueEntries
      .filter((entry) => entry.request)
      .map((entry) => ({
        ...entry.request,
        queueStatus: entry.status,
        enteredQueueAt: entry.enteredQueueAt,
        assignedAt: entry.assignedAt,
      }));
  }
}
