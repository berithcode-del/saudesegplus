import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeleconsultationController } from './teleconsultation.controller';

describe('TeleconsultationController createRoom guard', () => {
  it('blocks a finished exam request and logs a timeline event', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-a',
          environment: 'REAL',
        }),
      },
      examRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-a',
          status: 'CONCLUIDO',
          inviteId: 'invite-a',
          environment: 'REAL',
        }),
      },
      examTimelineEvent: { create: jest.fn().mockResolvedValue({}) },
      teleconsultation: { findFirst: jest.fn() },
    };
    const controller = new TeleconsultationController(
      prisma as never,
      {} as never,
    );

    await expect(
      controller.createRoom(
        { user: { role: 'DOCTOR', profileId: 'doctor-a' } } as never,
        { examRequestId: 'request-a' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.examTimelineEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: 'TELECONSULTA_BLOQUEADA',
        examRequestId: 'request-a',
      }),
    });
    expect(prisma.teleconsultation.findFirst).not.toHaveBeenCalled();
  });

  it('blocks a sandbox doctor from opening a real consultation', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-sandbox',
          environment: 'SANDBOX',
        }),
      },
      examRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-real',
          status: 'AGUARDANDO_COLETA',
          inviteId: null,
          environment: 'REAL',
        }),
      },
      teleconsultation: { findFirst: jest.fn() },
    };
    const controller = new TeleconsultationController(
      prisma as never,
      {} as never,
    );

    await expect(
      controller.createRoom(
        { user: { role: 'DOCTOR', profileId: 'doctor-sandbox' } } as never,
        { examRequestId: 'request-real' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.teleconsultation.findFirst).not.toHaveBeenCalled();
  });
});
