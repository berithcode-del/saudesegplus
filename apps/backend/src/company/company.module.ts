import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyGateway } from './company.gateway';
import { PrismaService } from '../prisma.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { CompanyInviteScopeGuard } from '../auth/company-invite-scope.guard';

@Module({
  imports: [MailModule, AuthModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyGateway, PrismaService, WsJwtGuard, CompanyInviteScopeGuard],
  exports: [CompanyService, CompanyGateway, WsJwtGuard],
})
export class CompanyModule {}
