import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';

describe('QueueService claim protection', () => {
  function createService(claimedCount: number) {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-a',
          environment: 'REAL',
        }),
      },
      queueEntry: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'entry-a',
          requestId: 'request-a',
          request: { invite: null, environment: 'REAL' },
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
    expect(prisma.queueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'entry-a', status: 'WAITING', assignedDoctorId: null },
        data: expect.objectContaining({ assignedDoctorId: 'doctor-a' }),
      }),
    );
  });

  it('rejects a second doctor after the patient was claimed', async () => {
    const { service } = createService(0);
    await expect(
      service.acceptPatient('entry-a', 'doctor-b'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('filters the shared queue by the doctor environment', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-sandbox',
          environment: 'SANDBOX',
          city: 'Sao Paulo',
          state: 'SP',
        }),
      },
      queueEntry: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new QueueService(
      prisma as never,
      {} as never,
      { isOnline: jest.fn() } as never,
    );

    await service.getQueueForDoctor('doctor-sandbox');

    expect(prisma.queueEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'WAITING',
          request: { environment: 'SANDBOX' },
        },
      }),
    );
  });

  it('rejects a real patient claimed by a sandbox doctor', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-sandbox',
          environment: 'SANDBOX',
        }),
      },
      queueEntry: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'entry-real',
          requestId: 'request-real',
          request: { invite: null, environment: 'REAL' },
        }),
        updateMany: jest.fn(),
      },
      examRequest: {
        update: jest.fn(),
      },
    };
    const service = new QueueService(prisma as never, {} as never, {} as never);

    await expect(
      service.acceptPatient('entry-real', 'doctor-sandbox'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.queueEntry.updateMany).not.toHaveBeenCalled();
  });
});
