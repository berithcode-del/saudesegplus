import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class WsJwtGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): Promise<boolean>;
    private static verifyToken;
}
