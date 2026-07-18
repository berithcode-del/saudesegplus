"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CalendarService = class CalendarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertOwnerAccess(ownerType, ownerId, user) {
        if (user.role === 'ADMIN')
            return;
        const expectedType = {
            COMPANY_ADMIN: 'company',
            DOCTOR: 'doctor',
            CLINIC: 'clinic',
        };
        if (user.role === 'OPERATOR') {
            const operator = await this.prisma.operator.findUnique({
                where: { id: user.profileId ?? '' },
                select: { clinicId: true },
            });
            if (ownerType === 'clinic' && operator?.clinicId === ownerId)
                return;
        }
        else if (expectedType[user.role] === ownerType && user.profileId === ownerId) {
            return;
        }
        throw new common_1.ForbiddenException('Acesso negado a este calendario');
    }
    async assertEventAccess(id, user) {
        const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Evento nao encontrado');
        const ownerType = event.companyId ? 'company' : event.doctorId ? 'doctor' : 'clinic';
        const ownerId = event.companyId ?? event.doctorId ?? event.clinicId ?? '';
        await this.assertOwnerAccess(ownerType, ownerId, user);
    }
    async listEvents(ownerType, ownerId, startDate, endDate) {
        if (!ownerType || !ownerId) {
            throw new common_1.BadRequestException('ownerType and ownerId are required');
        }
        const where = {};
        if (ownerType === 'doctor')
            where.doctorId = ownerId;
        if (ownerType === 'company')
            where.companyId = ownerId;
        if (ownerType === 'clinic')
            where.clinicId = ownerId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        return this.prisma.calendarEvent.findMany({
            where,
            orderBy: { date: 'asc' },
        });
    }
    async createEvent(data) {
        const { title, type, date, ownerType, ownerId } = data;
        if (!title || !date || !ownerType || !ownerId) {
            throw new common_1.BadRequestException('Missing required fields for calendar event');
        }
        const dataToCreate = {
            title,
            type: type || 'geral',
            date: new Date(date),
        };
        if (ownerType === 'doctor')
            dataToCreate.doctorId = ownerId;
        else if (ownerType === 'company')
            dataToCreate.companyId = ownerId;
        else if (ownerType === 'clinic')
            dataToCreate.clinicId = ownerId;
        else
            throw new common_1.BadRequestException('Invalid ownerType');
        return this.prisma.calendarEvent.create({
            data: dataToCreate,
        });
    }
    async updateEvent(id, data) {
        const { title, type, date } = data;
        if (!title && !type && !date) {
            throw new common_1.BadRequestException('At least one field is required for update');
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (type !== undefined)
            updateData.type = type;
        if (date !== undefined)
            updateData.date = new Date(date);
        return this.prisma.calendarEvent.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteEvent(id) {
        return this.prisma.calendarEvent.delete({
            where: { id },
        });
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map