"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const ONLINE_THRESHOLD_MS = 30_000;
let PresenceService = class PresenceService {
    heartbeats = new Map();
    recordHeartbeat(processId) {
        this.heartbeats.set(processId, new Date());
    }
    isOnline(processId) {
        const last = this.heartbeats.get(processId);
        if (!last)
            return false;
        return Date.now() - last.getTime() < ONLINE_THRESHOLD_MS;
    }
    getOnlineProcessIds() {
        const now = Date.now();
        const online = [];
        for (const [id, last] of this.heartbeats.entries()) {
            if (now - last.getTime() < ONLINE_THRESHOLD_MS) {
                online.push(id);
            }
        }
        return online;
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)()
], PresenceService);
//# sourceMappingURL=presence.service.js.map