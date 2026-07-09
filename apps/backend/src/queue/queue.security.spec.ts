import { ConflictException } from '@nestjs/common';
import { QueueService } from './queue.service';

describe('QueueService claim protection', () => {
  function createService(claimedCount: number) {
    const prisma = {
      queueEntry: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'entry-a',
          requestId: 'request-a',
          request: { invite: null },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: claimedCount }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'entry-a',
          requestId: 'request-a',
          assignedDoctorId: 'doctor-a',
        }),
      },
      examRequest: { update: jest.fn().mockResolvedValue({}) },
    };
    return {
      service: new QueueService(prisma as never, {} as never, {} as never),
      prisma,
    };
  }

  it('claims a waiting patient for exactly one doctor', async () => {
    const { service, prisma } = createService(1);
    const result = await service.acceptPatient('entry-a', 'doctor-a');

    expect(result.assignedDoctorId).toBe('doctor-a');
    expect(prisma.queueEntry.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'entry-a', status: 'WAITING', assignedDoctorId: null },
      data: expect.objectContaining({ assignedDoctorId: 'doctor-a' }),
    }));
  });

  it('rejects a second doctor after the patient was claimed', async () => {
    const { service } = createService(0);
    await expect(service.acceptPatient('entry-a', 'doctor-b'))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
