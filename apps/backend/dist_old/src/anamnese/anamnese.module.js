"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnamneseModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const anamnese_controller_1 = require("./anamnese.controller");
const anamnese_service_1 = require("./anamnese.service");
let AnamneseModule = class AnamneseModule {
};
exports.AnamneseModule = AnamneseModule;
exports.AnamneseModule = AnamneseModule = __decorate([
    (0, common_1.Module)({
        controllers: [anamnese_controller_1.AnamneseController],
        providers: [anamnese_service_1.AnamneseService, prisma_service_1.PrismaService],
    })
], AnamneseModule);
//# sourceMappingURL=anamnese.module.js.map