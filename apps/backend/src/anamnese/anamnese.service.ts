import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnamneseService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string) {
    return this.prisma.anamnese.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(patientId: string, data: {
    queixas?: string;
    historicoOcupacional?: string;
    historicoMedico?: string;
    medicamentos?: string;
    habitos?: string;
  }) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    const existing = await this.prisma.anamnese.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.prisma.anamnese.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.anamnese.create({
      data: { patientId, ...data },
    });
  }
}
