import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { CreateCompanyDto } from '../../company/dto/create-company.dto';
import { ValidateInviteDto } from '../../colaborador/dto/validate-invite.dto';

describe('password validation boundaries', () => {
  it('allows an existing six-character password during login', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'empresa@example.com',
      password: '123456',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('keeps the six-character minimum for new company registrations', async () => {
    const dto = Object.assign(new CreateCompanyDto(), {
      cnpj: '12345678000195',
      razaoSocial: 'Empresa de Teste',
      contactEmail: 'empresa@example.com',
      password: '123456',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('keeps collaborator invite passwords at twelve characters', async () => {
    const dto = Object.assign(new ValidateInviteDto(), {
      token: '00000000-0000-0000-0000-000000000000',
      name: 'Colaborador de Teste',
      password: '123456',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
