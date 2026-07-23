import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('clinic workspace actor session', () => {
  const prisma = {
    operator: { findUnique: jest.fn() },
    clinicDoctor: { findUnique: jest.fn() },
    clinicActorSession: { create: jest.fn(), updateMany: jest.fn() },
    clinicAuditEvent: { create: jest.fn() },
  } as any;
  const jwt = { sign: jest.fn(() => 'actor-token') } as any;
  const service = new AuthService(prisma, jwt);
  const clinicUser = {
    sub: 'clinic-user',
    email: 'clinic@example.com',
    role: 'CLINIC',
    profileId: 'clinic-a',
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects an operator from another clinic', async () => {
    prisma.operator.findUnique.mockResolvedValue({
      id: 'operator-a', clinicId: 'clinic-b', isActive: true, operationalPinHash: 'hash', name: 'Ana',
    });

    await expect(
      service.activateClinicActor(clinicUser, { actorType: 'OPERATOR', actorId: 'operator-a', pin: '123456' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an invalid operational pin', async () => {
    prisma.operator.findUnique.mockResolvedValue({
      id: 'operator-a', clinicId: 'clinic-a', isActive: true, operationalPinHash: 'hash', name: 'Ana',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.activateClinicActor(clinicUser, { actorType: 'OPERATOR', actorId: 'operator-a', pin: '000000' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues a scoped token for a valid operator', async () => {
    prisma.operator.findUnique.mockResolvedValue({
      id: 'operator-a', clinicId: 'clinic-a', isActive: true, operationalPinHash: 'hash', name: 'Ana',
    });
    prisma.clinicActorSession.create.mockResolvedValue({ id: 'session-a' });
    prisma.clinicAuditEvent.create.mockResolvedValue({});
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.activateClinicActor(clinicUser, { actorType: 'OPERATOR', actorId: 'operator-a', pin: '123456' }),
    ).resolves.toMatchObject({ token: 'actor-token', actor: { id: 'operator-a', type: 'OPERATOR' } });
    expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({
      role: 'OPERATOR', profileId: 'operator-a', workspaceClinicId: 'clinic-a', actorSessionId: 'session-a',
    }), expect.any(Object));
  });
});
