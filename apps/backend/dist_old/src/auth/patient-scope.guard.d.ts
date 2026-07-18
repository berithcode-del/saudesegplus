import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class PatientScopeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
