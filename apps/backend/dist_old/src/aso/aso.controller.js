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
exports.AsoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const aso_service_1 = require("./aso.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AsoController = class AsoController {
    asoService;
    constructor(asoService) {
        this.asoService = asoService;
    }
    async generatePdf(req, body) {
        const result = await this.asoService.generatePdf(body.examRequestId, req.user.sub, body.decision, body.restrictionNotes);
        return {
            success: true,
            pdfUrl: result.pdfUrl,
            asoDocumentId: result.asoDocumentId,
        };
    }
};
exports.AsoController = AsoController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AsoController.prototype, "generatePdf", null);
exports.AsoController = AsoController = __decorate([
    (0, common_1.Controller)('api/aso'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('DOCTOR'),
    __metadata("design:paramtypes", [aso_service_1.AsoService])
], AsoController);
//# sourceMappingURL=aso.controller.js.map