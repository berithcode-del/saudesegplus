import { Controller, Post, Get, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';
import { ActivateClinicActorDto } from './dto/clinic-actor.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('clinic-workspace/actors')
  async clinicActors(@Request() req: any) {
    return this.authService.listClinicActors(req.user);
  }

  @Post('clinic-workspace/activate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async activateClinicActor(@Request() req: any, @Body() body: ActivateClinicActorDto) {
    return this.authService.activateClinicActor(req.user, body);
  }

  @Post('clinic-workspace/end')
  async endClinicActor(@Request() req: any) {
    return this.authService.endClinicActorSession(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.me(req.user.sub, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
    if (req.user.actorSessionId) {
      throw new ForbiddenException('Encerre a sessao profissional para alterar a senha da clinica');
    }
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }
}
