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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const signature_service_1 = require("./signature.service");
let SignatureController = class SignatureController {
    signatureService;
    constructor(signatureService) {
        this.signatureService = signatureService;
    }
    async generateLink(req, body) {
        const result = await this.signatureService.generateLink(body.examRequestId, req.user.sub);
        return { success: true, ...result };
    }
    async signDocument(req, id, body) {
        return this.signatureService.signDocument(id, req.user.sub, body.pin);
    }
    async handleWebhook(payload, webhookSecret) {
        return this.signatureService.handleWebhook(payload, webhookSecret);
    }
};
exports.SignatureController = SignatureController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SignatureController.prototype, "generateLink", null);
__decorate([
    (0, common_1.Post)('sign/:id'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SignatureController.prototype, "signDocument", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-signature-webhook-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SignatureController.prototype, "handleWebhook", null);
exports.SignatureController = SignatureController = __decorate([
    (0, common_1.Controller)('api/signature'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [signature_service_1.SignatureService])
], SignatureController);
//# sourceMappingURL=signature.controller.js.map