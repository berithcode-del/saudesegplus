"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientScopeGuard = void 0;
const common_1 = require("@nestjs/common");
let PatientScopeGuard = class PatientScopeGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (request.user?.role === 'ADMIN')
            return true;
        if (request.user?.role !== 'PATIENT' ||
            !request.user.profileId ||
            request.params?.id !== request.user.profileId) {
            throw new common_1.ForbiddenException('Acesso restrito ao proprio cadastro');
        }
        return true;
    }
};
exports.PatientScopeGuard = PatientScopeGuard;
exports.PatientScopeGuard = PatientScopeGuard = __decorate([
    (0, common_1.Injectable)()
], PatientScopeGuard);
//# sourceMappingURL=patient-scope.guard.js.map