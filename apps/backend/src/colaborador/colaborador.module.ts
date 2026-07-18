import { Module } from '@nestjs/common';
import { ColaboradorController } from './colaborador.controller';
import { ColaboradorService } from './colaborador.service';
import { PrismaService } from '../prisma.service';
import { CompanyModule } from '../company/company.module';
import { AsoProtocoloModule } from '../aso-protocolo/aso-protocolo.module';

@Module({
  imports: [CompanyModule, AsoProtocoloModule],
  controllers: [ColaboradorController],
  providers: [ColaboradorService, PrismaService],
})
export class ColaboradorModule {}
