"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var WsJwtGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const crypto = __importStar(require("crypto"));
const jwt_secret_1 = require("./jwt-secret");
let WsJwtGuard = WsJwtGuard_1 = class WsJwtGuard {
    logger = new common_1.Logger(WsJwtGuard_1.name);
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = client.handshake.auth?.token ||
            client.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            this.logger.warn(`[WsJwtGuard] Client ${client.id} without token`);
            throw new websockets_1.WsException('Unauthorized');
        }
        try {
            const payload = WsJwtGuard_1.verifyToken(token);
            client.data.user = payload;
            return true;
        }
        catch {
            this.logger.warn(`[WsJwtGuard] Invalid token from client ${client.id}`);
            throw new websockets_1.WsException('Unauthorized');
        }
    }
    static verifyToken(token) {
        const parts = token.split('.');
        if (parts.length !== 3)
            throw new Error('Malformed token');
        const [header, payload, signature] = parts;
        const expectedSig = crypto
            .createHmac('sha256', (0, jwt_secret_1.getJwtSecret)())
            .update(`${header}.${payload}`)
            .digest('base64url');
        if (signature.length !== expectedSig.length ||
            !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
            throw new Error('Invalid signature');
        }
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Expired token');
        }
        if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
            throw new Error('Invalid token payload');
        }
        return decoded;
    }
};
exports.WsJwtGuard = WsJwtGuard;
exports.WsJwtGuard = WsJwtGuard = WsJwtGuard_1 = __decorate([
    (0, common_1.Injectable)()
], WsJwtGuard);
//# sourceMappingURL=ws-jwt.guard.js.map