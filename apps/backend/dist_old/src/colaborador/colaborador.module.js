"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColaboradorModule = void 0;
const common_1 = require("@nestjs/common");
const colaborador_controller_1 = require("./colaborador.controller");
const colaborador_service_1 = require("./colaborador.service");
const prisma_service_1 = require("../prisma.service");
const company_module_1 = require("../company/company.module");
let ColaboradorModule = class ColaboradorModule {
};
exports.ColaboradorModule = ColaboradorModule;
exports.ColaboradorModule = ColaboradorModule = __decorate([
    (0, common_1.Module)({
        imports: [company_module_1.CompanyModule],
        controllers: [colaborador_controller_1.ColaboradorController],
        providers: [colaborador_service_1.ColaboradorService, prisma_service_1.PrismaService],
    })
], ColaboradorModule);
//# sourceMappingURL=colaborador.module.js.map