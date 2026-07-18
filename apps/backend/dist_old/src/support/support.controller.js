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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const support_service_1 = require("./support.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const send_message_dto_1 = require("./dto/send-message.dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let SupportController = class SupportController {
    supportService;
    constructor(supportService) {
        this.supportService = supportService;
    }
    async createTicket(dto, req) {
        try {
            const result = await this.supportService.createTicket(dto, req.user);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async listUserTickets(req) {
        try {
            const result = await this.supportService.listUserTickets(req.user.sub);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async getTicket(id, req) {
        try {
            const result = await this.supportService.getTicket(id, req.user.sub);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async sendMessage(id, dto, req) {
        try {
            const result = await this.supportService.sendMessage(id, dto, req.user, 'USER');
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async listAllTickets(req, status) {
        try {
            if (req.user.role !== 'ADMIN') {
                return { success: false, message: 'Acesso restrito a administradores' };
            }
            const result = await this.supportService.listAllTickets(status);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async getAdminTicket(id, req) {
        try {
            if (req.user.role !== 'ADMIN') {
                return { success: false, message: 'Acesso restrito a administradores' };
            }
            const result = await this.supportService.getAdminTicket(id);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async sendAdminMessage(id, dto, req) {
        try {
            if (req.user.role !== 'ADMIN') {
                return { success: false, message: 'Acesso restrito a administradores' };
            }
            const result = await this.supportService.sendAdminMessage(id, dto, req.user);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
    async updateTicketStatus(id, body, req) {
        try {
            if (req.user.role !== 'ADMIN') {
                return { success: false, message: 'Acesso restrito a administradores' };
            }
            const result = await this.supportService.updateStatus(id, body.status);
            return { success: true, data: result };
        }
        catch (error) {
            throw error;
        }
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ticket_dto_1.CreateTicketDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "listUserTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Post)('tickets/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('admin/tickets'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "listAllTickets", null);
__decorate([
    (0, common_1.Get)('admin/tickets/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getAdminTicket", null);
__decorate([
    (0, common_1.Post)('admin/tickets/:id/messages'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "sendAdminMessage", null);
__decorate([
    (0, common_1.Patch)('admin/tickets/:id/status'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "updateTicketStatus", null);
exports.SupportController = SupportController = __decorate([
    (0, common_1.Controller)('api/support'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'CLINIC', 'DOCTOR'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map