import { ForbiddenException } from '@nestjs/common';
import { ExamRequestService } from './exam-request.service';

describe('ExamRequestService access control', () => {
  const request = {
    id: 'request-a',
    clinicId: 'clinic-a',
    invite: { companyId: 'company-a' },
    queueEntry: { assignedDoctorId: 'doctor-a' },
    patient: {
      companies: [{ companyId: 'company-a', endDate: null }],
    },
  };

  function serviceWith(found: unknown = request) {
    const prisma = {
      examRequest: { findUnique: jest.fn().mockResolvedValue(found) },
      operator: { findUnique: jest.fn() },
    };
    return new ExamRequestService(prisma as never, {} as never, {} as never);
  }

  it('allows a company to read its own request but blocks another company', async () => {
    const service = serviceWith();
    await expect(service.assertAccess('request-a', {
      role: 'COMPANY_ADMIN',
      profileId: 'company-a',
    })).resolves.toBeUndefined();

    await expect(service.assertAccess('request-a', {
      role: 'COMPANY_ADMIN',
      profileId: 'company-b',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only the assigned doctor to access a request', async () => {
    const service = serviceWith();
    await expect(service.assertAccess('request-a', {
      role: 'DOCTOR',
      profileId: 'doctor-a',
    })).resolves.toBeUndefined();

    await expect(service.assertAccess('request-a', {
      role: 'DOCTOR',
      profileId: 'doctor-b',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
