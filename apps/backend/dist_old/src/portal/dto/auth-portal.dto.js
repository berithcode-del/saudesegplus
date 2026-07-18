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
exports.AuthPortalDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AuthPortalDto {
    token;
    cpf;
    birthDate;
}
exports.AuthPortalDto = AuthPortalDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AuthPortalDto.prototype, "token", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.replace(/\D/g, '') : value),
    (0, class_validator_1.Matches)(/^\d{11}$/),
    __metadata("design:type", String)
], AuthPortalDto.prototype, "cpf", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{8})$/),
    __metadata("design:type", String)
], AuthPortalDto.prototype, "birthDate", void 0);
//# sourceMappingURL=auth-portal.dto.js.map