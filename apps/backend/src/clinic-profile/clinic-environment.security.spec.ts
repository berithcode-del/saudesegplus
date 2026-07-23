import { BadRequestException } from '@nestjs/common';
import { ClinicProfileController } from './clinic-profile.controller';

describe('ClinicProfileController environment isolation', () => {
  it('rejects associating a sandbox doctor with a real clinic', async () => {
    const prisma = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({
          clinicProfile: { id: 'clinic-real' },
          operatorProfile: null,
        }),
      },
      clinic: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'clinic-real',
          environment: 'REAL',
        }),
      },
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-sandbox',
          environment: 'SANDBOX',
          verifiedAt: new Date(),
        }),
      },
      clinicDoctor: {
        upsert: jest.fn(),
      },
    };
    const controller = new ClinicProfileController(
      prisma as never,
      {} as never,
    );

    await expect(
      controller.associateDoctor(
        { user: { sub: 'clinic-user' } },
        { doctorId: 'doctor-sandbox', operationalPin: '123456' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.clinicDoctor.upsert).not.toHaveBeenCalled();
  });
});
