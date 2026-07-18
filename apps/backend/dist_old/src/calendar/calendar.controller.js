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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const calendar_service_1 = require("./calendar.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let CalendarController = class CalendarController {
    calendarService;
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async list(ownerType, ownerId, startDate, endDate, req) {
        await this.calendarService.assertOwnerAccess(ownerType, ownerId, req.user);
        const data = await this.calendarService.listEvents(ownerType, ownerId, startDate, endDate);
        return { success: true, data };
    }
    async create(body, req) {
        await this.calendarService.assertOwnerAccess(body.ownerType, body.ownerId, req.user);
        const data = await this.calendarService.createEvent(body);
        return { success: true, data };
    }
    async update(id, body, req) {
        await this.calendarService.assertEventAccess(id, req.user);
        const data = await this.calendarService.updateEvent(id, body);
        return { success: true, data };
    }
    async remove(id, req) {
        await this.calendarService.assertEventAccess(id, req.user);
        await this.calendarService.deleteEvent(id);
        return { success: true, message: 'Event deleted successfully' };
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('ownerType')),
    __param(1, (0, common_1.Query)('ownerId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "remove", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)('api/calendar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPANY_ADMIN', 'DOCTOR', 'CLINIC', 'OPERATOR'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map