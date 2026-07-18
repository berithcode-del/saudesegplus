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
exports.QuestionarioDto = void 0;
const class_validator_1 = require("class-validator");
class QuestionarioDto {
    queixas;
    doencasPrevias;
    medicamentosEmUso;
    alergiasConhecidas;
    cirurgiasPrevias;
    observacoes;
    tabagismo;
    tabagismoDetalhe;
    alcool;
    alcoolDetalhe;
    atividadeFisica;
    sono;
    declaracaoVeracidade;
}
exports.QuestionarioDto = QuestionarioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "queixas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "doencasPrevias", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "medicamentosEmUso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "alergiasConhecidas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "cirurgiasPrevias", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "observacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['nao', 'ex_fumante', 'fumante']),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "tabagismo", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.tabagismo === 'ex_fumante' || o.tabagismo === 'fumante'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "tabagismoDetalhe", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['nao', 'social', 'frequente']),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "alcool", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "alcoolDetalhe", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['nao_informado', 'nao', 'ocasional', 'regular']),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "atividadeFisica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QuestionarioDto.prototype, "sono", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuestionarioDto.prototype, "declaracaoVeracidade", void 0);
//# sourceMappingURL=questionario.dto.js.map