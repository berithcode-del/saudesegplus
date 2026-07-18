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
exports.ExamRequestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const company_gateway_1 = require("../company/company.gateway");
const pagination_1 = require("../common/pagination");
const presence_service_1 = require("../presence/presence.service");
const supabase_storage_service_1 = require("../upload/supabase-storage.service");
const path_1 = require("path");
let ExamRequestService = class ExamRequestService {
    prisma;
    companyGateway;
    presenceService;
    storage;
    constructor(prisma, companyGateway, presenceService, storage) {
        this.prisma = prisma;
        this.companyGateway = companyGateway;
        this.presenceService = presenceService;
        this.storage = storage;
    }
    parseResultValue(value) {
        if (!value)
            return {};
        try {
            return JSON.parse(value);
        }
        catch {
            return {};
        }
    }
    async list(filters, page = 1, limit = 20, user) {
        const scopedCompanyId = user?.role === 'COMPANY_ADMIN' ? user.profileId : filters.companyId;
        const where = {
            status: filters.status,
            patient: scopedCompanyId
                ? { companies: { some: { companyId: scopedCompanyId } } }
                : undefined,
            patientId: filters.patientId,
        };
        if (user?.role === 'DOCTOR') {
            where.queueEntry = { assignedDoctorId: user.profileId };
        }
        else if (user?.role === 'CLINIC') {
            where.clinicId = user.profileId;
        }
        else if (user?.role === 'OPERATOR') {
            const operator = await this.prisma.operator.findUnique({
                where: { id: user.profileId ?? '' },
                select: { clinicId: true },
            });
            if (!operator)
                throw new common_1.ForbiddenException('Acesso negado');
            where.clinicId = operator.clinicId;
        }
        return (0, pagination_1.paginate)(this.prisma.examRequest, page, limit, {
            where,
            include: {
                patient: true,
                clinic: true,
                invite: true,
                results: { include: { type: true } },
                asoDocuments: { orderBy: { signedAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        if (user)
            await this.assertAccess(id, user);
        const request = await this.prisma.examRequest.findUnique({
            where: { id },
            include: {
                patient: {
                    include: {
                        anamneses: { orderBy: { createdAt: 'desc' }, take: 1 },
                    },
                },
                clinic: true,
                invite: { include: { company: true } },
                results: { include: { type: true } },
                asoDocuments: { orderBy: { signedAt: 'desc' } },
                teleconsultations: { orderBy: { startedAt: 'desc' }, take: 1 },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada');
        const results = request.results.map((r) => ({
            ...r,
            valueJson: this.parseResultValue(r.valueJson),
        }));
        return {
            ...request,
            results,
            presence: {
                patientOnline: this.presenceService.isOnline(request.id),
            },
        };
    }
    async assertAccess(id, user, write = false) {
        if (user.role === 'ADMIN')
            return;
        const request = await this.prisma.examRequest.findUnique({
            where: { id },
            include: {
                invite: true,
                queueEntry: true,
                patient: { include: { companies: true } },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitacao nao encontrada');
        let allowed = false;
        if (user.role === 'COMPANY_ADMIN') {
            allowed =
                !write &&
                    request.patient.companies.some((relation) => relation.companyId === user.profileId && !relation.endDate);
        }
        else if (user.role === 'DOCTOR') {
            allowed = request.queueEntry?.assignedDoctorId === user.profileId;
        }
        else if (user.role === 'CLINIC') {
            allowed = request.clinicId === user.profileId;
        }
        else if (user.role === 'OPERATOR') {
            const operator = await this.prisma.operator.findUnique({
                where: { id: user.profileId ?? '' },
                select: { clinicId: true },
            });
            allowed = operator?.clinicId === request.clinicId;
        }
        if (!allowed)
            throw new common_1.ForbiddenException('Acesso negado a esta solicitacao');
    }
    async getResultAttachment(resultId, user) {
        const result = await this.prisma.examResult.findUnique({
            where: { id: resultId },
        });
        if (!result?.attachmentUrl)
            throw new common_1.NotFoundException('Anexo nao encontrado');
        await this.assertAccess(result.requestId, user);
        const fileName = (0, path_1.basename)(result.attachmentUrl);
        if (!/^[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$/i.test(fileName)) {
            throw new common_1.NotFoundException('Anexo nao encontrado');
        }
        return {
            buffer: await this.storage.downloadFile('uploads', fileName),
            fileName,
        };
    }
    async updateStatus(id, body) {
        const existing = await this.prisma.examRequest.findUnique({
            where: { id },
            include: { invite: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Solicitação não encontrada');
        const updated = await this.prisma.$transaction(async (tx) => {
            const req = await tx.examRequest.update({
                where: { id },
                data: { status: body.status },
            });
            if (body.decision) {
                const validUntil = new Date();
                validUntil.setFullYear(validUntil.getFullYear() + 1);
                await tx.asoDocument.create({
                    data: {
                        requestId: id,
                        doctorId: body.doctorId ?? 'system',
                        decision: body.decision,
                        restrictionNotes: body.restrictionNotes ?? null,
                        validUntil,
                    },
                });
            }
            if (body.laudoTexto && existing.invite) {
                await tx.examTimelineEvent.create({
                    data: {
                        inviteId: existing.invite.id,
                        examRequestId: id,
                        eventType: 'CONCLUIDO',
                        metadata: body.laudoTexto,
                    },
                });
            }
            return req;
        });
        if (existing.invite) {
            this.companyGateway.emitInviteStatusChange(existing.invite.companyId, {
                inviteId: existing.invite.id,
                status: existing.invite.status,
                examStatus: body.status,
            });
        }
        return updated;
    }
};
exports.ExamRequestService = ExamRequestService;
exports.ExamRequestService = ExamRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_gateway_1.CompanyGateway,
        presence_service_1.PresenceService,
        supabase_storage_service_1.SupabaseStorageService])
], ExamRequestService);
//# sourceMappingURL=exam-request.service.js.map