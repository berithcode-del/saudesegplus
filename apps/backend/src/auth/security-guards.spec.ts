import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyScopeGuard } from './company-scope.guard';
import { PatientScopeGuard } from './patient-scope.guard';
import { getJwtSecret } from './jwt-secret';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('security scope guards', () => {
  const companyGuard = new CompanyScopeGuard();
  const patientGuard = new PatientScopeGuard();

  it('allows a company administrator to access only their company', () => {
    expect(companyGuard.canActivate(contextFor({
      user: { role: 'COMPANY_ADMIN', profileId: 'company-a' },
      params: { id: 'company-a' },
    }))).toBe(true);

    expect(() => companyGuard.canActivate(contextFor({
      user: { role: 'COMPANY_ADMIN', profileId: 'company-a' },
      params: { id: 'company-b' },
    }))).toThrow(ForbiddenException);
  });

  it('allows a patient to access only their own record', () => {
    expect(patientGuard.canActivate(contextFor({
      user: { role: 'PATIENT', profileId: 'patient-a' },
      params: { id: 'patient-a' },
    }))).toBe(true);

    expect(() => patientGuard.canActivate(contextFor({
      user: { role: 'PATIENT', profileId: 'patient-a' },
      params: { id: 'patient-b' },
    }))).toThrow(ForbiddenException);
  });
});

describe('JWT secret configuration', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('rejects missing and short secrets', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');

    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
  });

  it('accepts a secret with at least 32 characters', () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(getJwtSecret()).toBe('a'.repeat(32));
  });
});
