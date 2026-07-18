"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SafeExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let SafeExceptionFilter = SafeExceptionFilter_1 = class SafeExceptionFilter {
    logger = new common_1.Logger(SafeExceptionFilter_1.name);
    catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();
        const isHttpException = exception && typeof exception.getStatus === 'function';
        const status = isHttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        if (status >= 500) {
            const error = exception instanceof Error ? exception : undefined;
            this.logger.error(`${request.method} ${request.path} failed: ${error?.message ?? String(exception)}`, error?.stack);
        }
        const publicResponse = isHttpException
            ? exception.getResponse()
            : { message: 'Erro interno. Tente novamente mais tarde.' };
        response.status(status).json({
            statusCode: status,
            ...(typeof publicResponse === 'string'
                ? { message: publicResponse }
                : publicResponse),
            timestamp: new Date().toISOString(),
            path: request.path,
        });
    }
};
exports.SafeExceptionFilter = SafeExceptionFilter;
exports.SafeExceptionFilter = SafeExceptionFilter = SafeExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], SafeExceptionFilter);
//# sourceMappingURL=safe-exception.filter.js.map