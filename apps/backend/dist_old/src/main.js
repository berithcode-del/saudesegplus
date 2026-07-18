"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const allowed_origins_1 = require("./security/allowed-origins");
const safe_exception_filter_1 = require("./security/safe-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new safe_exception_filter_1.SafeExceptionFilter());
    app.use((0, express_1.json)({ limit: '1mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '1mb' }));
    app.use((_request, response, next) => {
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('Referrer-Policy', 'no-referrer');
        response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        if (process.env.NODE_ENV === 'production') {
            response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    });
    const allowedOrigins = (0, allowed_origins_1.getAllowedOrigins)();
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.enableShutdownHooks();
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port, '0.0.0.0');
    console.log(`SaudeSeg+ Backend running on port ${port}`);
}
bootstrap().catch((error) => {
    console.error('Failed to start SaudeSeg+ Backend', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map