import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class CompanyScopeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
