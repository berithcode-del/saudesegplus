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
exports.PortalSessionGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const jwt_secret_1 = require("../auth/jwt-secret");
let PortalSessionGuard = class PortalSessionGuard {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token)
            throw new common_1.UnauthorizedException('Token não encontrado');
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: (0, jwt_secret_1.getJwtSecret)(),
            });
            if (payload.role !== 'PORTAL') {
                throw new common_1.UnauthorizedException('Acesso não autorizado');
            }
            request.user = {
                patientId: payload.sub,
                processId: payload.processId,
                role: payload.role,
            };
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Token inválido ou expirado');
        }
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.PortalSessionGuard = PortalSessionGuard;
exports.PortalSessionGuard = PortalSessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], PortalSessionGuard);
//# sourceMappingURL=portal-session.guard.js.map