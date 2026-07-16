import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        operatorProfile: { include: { clinic: true } },
        patientProfile: true,
        companyAdminProfile: { include: { company: true } },
        clinicProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let profileId: string | null = null;
    if (user.role === 'DOCTOR') {
      if (!user.doctorProfile?.verifiedAt) {
        throw new UnauthorizedException('Cadastro pendente de aprovação pela administração.');
      }
      profileId = user.doctorProfile.id;
    }
    else if (user.role === 'COMPANY_ADMIN') profileId = user.companyAdminProfile?.companyId ?? null;
    else if (user.role === 'OPERATOR') profileId = user.operatorProfile?.id ?? null;
    else if (user.role === 'CLINIC') profileId = user.clinicProfile?.id ?? null;
    else if (user.role === 'PATIENT') profileId = user.patientProfile?.id ?? null;

    const payload = { sub: user.id, email: user.email, role: user.role, profileId };
    const token = this.jwtService.sign(payload);

    const { passwordHash, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async me(userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        operatorProfile: { include: { clinic: true } },
        patientProfile: true,
        companyAdminProfile: { include: { company: true } },
        clinicProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.userAccount.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Senha alterada com sucesso' };
  }
}
