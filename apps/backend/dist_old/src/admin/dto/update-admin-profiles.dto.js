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
exports.SetMatrizClinicDto = exports.UpdateAdminClinicDto = exports.UpdateAdminCompanyDto = exports.UpdateAdminDoctorDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateAdminDoctorDto {
    name;
    gender;
    crmNumber;
    crmState;
    city;
    state;
    specialties;
    rqeNumber;
    phone;
    contactEmail;
    accessEmail;
}
exports.UpdateAdminDoctorDto = UpdateAdminDoctorDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['male', 'female']),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "crmNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "crmState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "specialties", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "rqeNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminDoctorDto.prototype, "accessEmail", void 0);
class UpdateAdminCompanyDto {
    razaoSocial;
    nomeFantasia;
    cnpj;
    address;
    cep;
    city;
    state;
    phone;
    contactEmail;
    accessEmail;
    status;
}
exports.UpdateAdminCompanyDto = UpdateAdminCompanyDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "razaoSocial", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "nomeFantasia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "cep", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "accessEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompanyStatus),
    __metadata("design:type", String)
], UpdateAdminCompanyDto.prototype, "status", void 0);
class UpdateAdminClinicDto {
    name;
    cnpj;
    address;
    city;
    state;
    phone;
    contactEmail;
    accessEmail;
}
exports.UpdateAdminClinicDto = UpdateAdminClinicDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, value) => value !== ''),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminClinicDto.prototype, "accessEmail", void 0);
class SetMatrizClinicDto {
    setAsMatriz;
}
exports.SetMatrizClinicDto = SetMatrizClinicDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetMatrizClinicDto.prototype, "setAsMatriz", void 0);
//# sourceMappingURL=update-admin-profiles.dto.js.map