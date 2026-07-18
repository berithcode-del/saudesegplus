"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyScopeGuard = void 0;
const common_1 = require("@nestjs/common");
let CompanyScopeGuard = class CompanyScopeGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (request.user?.role === 'ADMIN')
            return true;
        if (request.user?.role !== 'COMPANY_ADMIN' || !request.user.profileId) {
            throw new common_1.ForbiddenException('Acesso restrito a esta empresa');
        }
        const contentType = request.headers?.['content-type'] || '';
        const isMultipart = contentType.includes('multipart/form-data');
        let requestedCompanyId;
        if (!isMultipart) {
            requestedCompanyId =
                request.params?.companyId ??
                    request.params?.id ??
                    (typeof request.body?.companyId === 'string' ? request.body.companyId : undefined);
        }
        else {
            requestedCompanyId = request.user.profileId;
        }
        if (!requestedCompanyId || requestedCompanyId !== request.user.profileId) {
            throw new common_1.ForbiddenException('Acesso restrito a esta empresa');
        }
        return true;
    }
};
exports.CompanyScopeGuard = CompanyScopeGuard;
exports.CompanyScopeGuard = CompanyScopeGuard = __decorate([
    (0, common_1.Injectable)()
], CompanyScopeGuard);
//# sourceMappingURL=company-scope.guard.js.map