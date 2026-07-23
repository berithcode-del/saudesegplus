import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { OperatorMessagingService } from './operator-messaging.service';

describe('OperatorMessagingService permissions', () => {
  it('rejects patient access to operational messages', async () => {
    const service = new OperatorMessagingService({} as never);

    await expect(
      service.listConversations({
        sub: 'user-patient',
        email: 'patient@example.com',
        role: 'PATIENT',
        profileId: 'patient-a',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates notifications for conversation recipients when a message is sent', async () => {
    const prisma = {
      userAccount: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: 'admin-a',
            role: Role.ADMIN,
            email: 'admin@example.com',
          }),
      },
      operatorConversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conversation-a',
          title: null,
          participants: [{ userId: 'admin-a' }, { userId: 'doctor-user-a' }],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      operatorMessage: {
        create: jest.fn().mockResolvedValue({ id: 'message-a', content: 'Oi' }),
      },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const service = new OperatorMessagingService(prisma as never);

    await service.sendMessage(
      {
        sub: 'admin-a',
        email: 'admin@example.com',
        role: 'ADMIN',
        profileId: null,
      },
      'conversation-a',
      'Oi',
    );

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'doctor-user-a',
          type: 'OPERATOR_MESSAGE',
          targetId: 'conversation-a',
        }),
      ],
    });
  });

  it('rejects a conversation between real and sandbox profiles', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'doctor-real',
          userId: 'doctor-user-real',
          name: 'Medico Real',
          environment: 'REAL',
        }),
      },
      userAccount: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'doctor-user-real',
            role: Role.DOCTOR,
            email: 'real@saudeseg.com',
            doctorProfile: { name: 'Medico Real', environment: 'REAL' },
            clinicProfile: null,
            operatorProfile: null,
          },
          {
            id: 'clinic-user-sandbox',
            role: Role.CLINIC,
            email: 'sandbox@saudeseg.com',
            doctorProfile: null,
            clinicProfile: { name: 'Clinica Teste', environment: 'SANDBOX' },
            operatorProfile: null,
          },
        ]),
      },
      operatorConversation: { create: jest.fn() },
    };
    const service = new OperatorMessagingService(prisma as never);

    await expect(
      service.createConversation(
        {
          sub: 'doctor-user-real',
          email: 'real@saudeseg.com',
          role: 'DOCTOR',
          profileId: 'doctor-real',
        },
        ['clinic-user-sandbox'],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.operatorConversation.create).not.toHaveBeenCalled();
  });
});
