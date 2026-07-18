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
exports.CompanyInviteScopeGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CompanyInviteScopeGuard = class CompanyInviteScopeGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (request.user?.role === 'ADMIN')
            return true;
        const inviteId = request.params?.inviteId ?? request.params?.id;
        if (!inviteId || request.user?.role !== 'COMPANY_ADMIN' || !request.user.profileId) {
            throw new common_1.ForbiddenException('Acesso restrito a esta empresa');
        }
        const invite = await this.prisma.examInvite.findUnique({
            where: { id: inviteId },
            select: { companyId: true },
        });
        if (!invite || invite.companyId !== request.user.profileId) {
            throw new common_1.ForbiddenException('Acesso restrito a esta empresa');
        }
        return true;
    }
};
exports.CompanyInviteScopeGuard = CompanyInviteScopeGuard;
exports.CompanyInviteScopeGuard = CompanyInviteScopeGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyInviteScopeGuard);
//# sourceMappingURL=company-invite-scope.guard.js.map