import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(ownerType: string, ownerId: string, startDate?: string, endDate?: string) {
    if (!ownerType || !ownerId) {
      throw new BadRequestException('ownerType and ownerId are required');
    }

    const where: any = {};
    if (ownerType === 'doctor') where.doctorId = ownerId;
    if (ownerType === 'company') where.companyId = ownerId;
    if (ownerType === 'clinic') where.clinicId = ownerId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async createEvent(data: any) {
    const { title, type, date, ownerType, ownerId } = data;

    if (!title || !date || !ownerType || !ownerId) {
      throw new BadRequestException('Missing required fields for calendar event');
    }

    const dataToCreate: any = {
      title,
      type: type || 'geral',
      date: new Date(date),
    };

    if (ownerType === 'doctor') dataToCreate.doctorId = ownerId;
    else if (ownerType === 'company') dataToCreate.companyId = ownerId;
    else if (ownerType === 'clinic') dataToCreate.clinicId = ownerId;
    else throw new BadRequestException('Invalid ownerType');

    return this.prisma.calendarEvent.create({
      data: dataToCreate,
    });
  }

  async updateEvent(id: string, data: any) {
    const { title, type, date } = data;

    if (!title && !type && !date) {
      throw new BadRequestException('At least one field is required for update');
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);

    return this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }
}
