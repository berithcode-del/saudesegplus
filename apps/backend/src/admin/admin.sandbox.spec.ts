import { AdminService } from './admin.service';

describe('AdminService sandbox records', () => {
  it('lists only sandbox patients with their protocol numbers', async () => {
    const prisma = {
      patient: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'patient-sandbox',
            name: 'Paciente Teste',
            processoAsos: [
              {
                id: 'processo-sandbox',
                numeroProtocolo: 'ASO-TESTE-001',
              },
            ],
          },
        ]),
      },
    };
    const service = new AdminService(prisma as never);

    const patients = await service.getSandboxPatients();

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { environment: 'SANDBOX' },
        select: expect.objectContaining({
          processoAsos: expect.objectContaining({
            select: expect.objectContaining({ numeroProtocolo: true }),
          }),
        }),
      }),
    );
    expect(patients[0].processoAsos[0].numeroProtocolo).toBe('ASO-TESTE-001');
  });

  it('clears only records resolved from sandbox roots', async () => {
    const makeDelegate = () => ({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });
    const tx = {
      clinic: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'clinic-sandbox',
            userId: 'clinic-user',
            operators: [{ id: 'operator-sandbox', userId: 'operator-user' }],
          },
        ]),
      },
      doctor: {
        ...makeDelegate(),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'doctor-sandbox', userId: 'doctor-user' }]),
      },
      company: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'company-sandbox',
            admins: [{ userId: 'company-user' }],
          },
        ]),
      },
      patient: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([
          { id: 'patient-sandbox', userId: 'patient-user' },
        ]),
      },
      examRequest: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([{ id: 'request-sandbox' }]),
      },
      examInvite: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([{ id: 'invite-sandbox' }]),
      },
      processoASO: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([{ id: 'processo-sandbox' }]),
      },
      payment: {
        ...makeDelegate(),
        findMany: jest.fn().mockResolvedValue([{ id: 'payment-sandbox' }]),
      },
      examTimelineEvent: makeDelegate(),
      asoDocument: makeDelegate(),
      patientDocument: makeDelegate(),
      queueEntry: makeDelegate(),
      teleconsultation: makeDelegate(),
      examResult: makeDelegate(),
      financialTransaction: makeDelegate(),
      anamnese: makeDelegate(),
      companyPatientRelation: makeDelegate(),
      companyDocument: makeDelegate(),
      calendarEvent: makeDelegate(),
      clinicAuditEvent: makeDelegate(),
      clinicActorSession: makeDelegate(),
      clinicDoctor: makeDelegate(),
      doctorCertificate: makeDelegate(),
      signatureAudit: makeDelegate(),
      operator: makeDelegate(),
      companyAdmin: makeDelegate(),
      supportTicket: makeDelegate(),
      notification: makeDelegate(),
      operatorMessage: makeDelegate(),
      operatorConversationParticipant: makeDelegate(),
      operatorConversation: makeDelegate(),
      userAccount: makeDelegate(),
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => unknown) => callback(tx),
      ),
    };
    const service = new AdminService(prisma as never);

    await service.clearSandbox();

    expect(tx.clinic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { environment: 'SANDBOX' } }),
    );
    expect(tx.doctor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { environment: 'SANDBOX' } }),
    );
    expect(tx.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { environment: 'SANDBOX' } }),
    );
    expect(tx.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { environment: 'SANDBOX' } }),
    );
    expect(tx.userAccount.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [
            'clinic-user',
            'operator-user',
            'doctor-user',
            'company-user',
            'patient-user',
          ],
        },
        role: { not: 'ADMIN' },
      },
    });
    expect(JSON.stringify(tx.userAccount.deleteMany.mock.calls)).not.toContain(
      'REAL',
    );
  });

  it('creates a clinic marked as sandbox', async () => {
    const prisma = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          email: 'clinica.teste@saudeseg.com',
          clinicProfile: {
            id: 'clinic-sandbox',
            name: 'Clinica Teste',
            environment: 'SANDBOX',
          },
        }),
      },
    };
    const service = new AdminService(prisma as never);

    await service.createClinic({
      name: 'Clinica Teste',
      cnpj: '00000000000191',
      email: 'clinica.teste@saudeseg.com',
      environment: 'SANDBOX' as never,
    });

    expect(prisma.userAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clinicProfile: {
            create: expect.objectContaining({ environment: 'SANDBOX' }),
          },
        }),
      }),
    );
  });

  it('creates a doctor marked as sandbox', async () => {
    const prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      userAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          email: 'medico.teste@saudeseg.com',
          doctorProfile: {
            id: 'doctor-sandbox',
            name: 'Medico Teste',
            environment: 'SANDBOX',
          },
        }),
      },
    };
    const service = new AdminService(prisma as never);

    await service.createDoctor({
      name: 'Medico Teste',
      crmNumber: 'TESTE-001',
      crmState: 'SP',
      email: 'medico.teste@saudeseg.com',
      environment: 'SANDBOX' as never,
    });

    expect(prisma.userAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doctorProfile: {
            create: expect.objectContaining({ environment: 'SANDBOX' }),
          },
        }),
      }),
    );
  });

  it('creates a sandbox company with its own administrator login', async () => {
    const tx = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'company-user',
          email: 'empresa.teste@saudeseg.com',
        }),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'company-sandbox',
          environment: 'SANDBOX',
        }),
      },
      companyAdmin: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new AdminService(prisma as never);

    await (service as any).createCompany({
      razaoSocial: 'Empresa Teste',
      cnpj: '00000000000272',
      email: 'empresa.teste@saudeseg.com',
      environment: 'SANDBOX',
    });

    expect(tx.company.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ environment: 'SANDBOX' }),
    });
  });
});
