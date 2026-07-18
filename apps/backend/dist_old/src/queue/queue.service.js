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
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("../company/company.gateway");
const presence_service_1 = require("../presence/presence.service");
let QueueService = class QueueService {
    prisma;
    companyGateway;
    presenceService;
    constructor(prisma, companyGateway, presenceService) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
        this.presenceService = presenceService;
    }
    calcGeoPriority(doctorState, doctorCity, patientState, patientCity) {
        if (doctorCity && patientCity && doctorCity.toLowerCase() === patientCity.toLowerCase())
            return 0;
        const regionMap = {
            SP: 'SE', RJ: 'SE', MG: 'SE', ES: 'SE',
            RS: 'S', SC: 'S', PR: 'S',
            MT: 'CO', MS: 'CO', GO: 'CO', DF: 'CO',
            AM: 'N', PA: 'N', AC: 'N', RO: 'N', RR: 'N', AP: 'N', TO: 'N',
            BA: 'NE', SE: 'NE', AL: 'NE', PE: 'NE', PB: 'NE', RN: 'NE', CE: 'NE', PI: 'NE', MA: 'NE',
        };
        const dRegion = regionMap[doctorState?.toUpperCase()] ?? 'OTHER';
        const pRegion = regionMap[patientState?.toUpperCase()] ?? 'OTHER';
        if (dRegion !== 'OTHER' && dRegion === pRegion)
            return 1;
        if (doctorState && patientState && doctorState.toUpperCase() === patientState.toUpperCase())
            return 2;
        return 3;
    }
    async getQueueForDoctor(doctorId) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
        });
        const entries = await this.prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: {
                request: {
                    include: {
                        patient: true,
                        results: { include: { type: true } },
                    },
                },
            },
        });
        return entries
            .filter((entry) => this.presenceService.isOnline(entry.requestId))
            .map((entry) => ({
            ...entry,
            isOnline: true,
            priorityScore: this.calcGeoPriority(doctor?.state ?? '', doctor?.city ?? '', entry.state ?? '', entry.city ?? ''),
        }))
            .sort((a, b) => {
            if (a.priorityScore !== b.priorityScore)
                return a.priorityScore - b.priorityScore;
            return new Date(a.enteredQueueAt).getTime() - new Date(b.enteredQueueAt).getTime();
        });
    }
    async enqueue(examRequestId) {
        const request = await this.prisma.examRequest.findUnique({
            where: { id: examRequestId },
            include: { clinic: true, invite: true },
        });
        if (!request)
            throw new Error('ExamRequest not found');
        const entry = await this.prisma.queueEntry.upsert({
            where: { requestId: examRequestId },
            create: {
                requestId: examRequestId,
                city: request.clinic?.city ?? '',
                state: request.clinic?.state ?? '',
                status: 'WAITING',
            },
            update: {},
        });
        if (request.invite) {
            await this.recordTimelineEvent(request.invite.id, examRequestId, 'EXAME_INICIADO');
        }
        return entry;
    }
    async acceptPatient(queueEntryId, doctorId) {
        const entry = await this.prisma.queueEntry.findUnique({
            where: { id: queueEntryId },
            include: { request: { include: { invite: true } } },
        });
        if (!entry)
            throw new common_1.NotFoundException('Atendimento nao encontrado');
        const claimed = await this.prisma.queueEntry.updateMany({
            where: { id: queueEntryId, status: 'WAITING', assignedDoctorId: null },
            data: {
                status: 'IN_PROGRESS',
                assignedDoctorId: doctorId,
                assignedAt: new Date(),
            },
        });
        if (claimed.count !== 1) {
            throw new common_1.ConflictException('Atendimento ja foi assumido por outro medico');
        }
        const updated = await this.prisma.queueEntry.findUniqueOrThrow({
            where: { id: queueEntryId },
        });
        await this.prisma.examRequest.update({
            where: { id: entry.requestId },
            data: { status: 'EM_ATENDIMENTO_MEDICO' },
        });
        if (entry.request?.invite) {
            await this.recordTimelineEvent(entry.request.invite.id, entry.requestId, 'EM_ATENDIMENTO_MEDICO');
        }
        return updated;
    }
    async recordTimelineEvent(inviteId, examRequestId, eventType) {
        const event = await this.prisma.examTimelineEvent.create({
            data: {
                inviteId,
                examRequestId,
                eventType: eventType,
            },
        });
        const invite = await this.prisma.examInvite.findUnique({
            where: { id: inviteId },
        });
        if (invite) {
            this.companyGateway.emitTimelineUpdate(invite.companyId, {
                inviteId,
                eventType,
                occurredAt: event.occurredAt.toISOString(),
            });
            this.companyGateway.emitInviteStatusChange(invite.companyId, {
                inviteId,
                status: invite.status,
                examStatus: eventType,
            });
        }
        return event;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway,
        presence_service_1.PresenceService])
], QueueService);
//# sourceMappingURL=queue.service.js.map