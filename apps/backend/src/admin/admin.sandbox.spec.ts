import { AdminService } from './admin.service';

describe('AdminService sandbox records', () => {
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
