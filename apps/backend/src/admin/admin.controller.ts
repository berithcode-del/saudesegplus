import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  UpdateAdminClinicDto,
  UpdateAdminCompanyDto,
  UpdateAdminDoctorDto,
  SetMatrizClinicDto,
} from './dto/update-admin-profiles.dto';
import { CompanyStatus, DataEnvironment } from '@prisma/client';

@Controller('api/admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private parseEnvironment(environment?: string): DataEnvironment {
    return environment === DataEnvironment.SANDBOX
      ? DataEnvironment.SANDBOX
      : DataEnvironment.REAL;
  }

  @Get('sandbox/patients')
  async getSandboxPatients() {
    return this.adminService.getSandboxPatients();
  }

  @Delete('sandbox')
  async clearSandbox() {
    return this.adminService.clearSandbox();
  }

  // ─── Companies ────────────────────────────────────────────────────────────
  @Get('companies')
  async getCompanies(
    @Query('status') status?: CompanyStatus,
    @Query('environment') environment?: string,
  ) {
    return this.adminService.getCompanies(
      status,
      this.parseEnvironment(environment),
    );
  }

  @Post('companies')
  async createCompany(
    @Body()
    body: {
      razaoSocial: string;
      nomeFantasia?: string;
      cnpj: string;
      address?: string;
      cep?: string;
      city?: string;
      state?: string;
      email?: string;
      environment?: DataEnvironment;
    },
  ) {
    return this.adminService.createCompany({
      ...body,
      environment: this.parseEnvironment(body.environment),
    });
  }

  @Get('companies/pending-approval')
  async getCompaniesPendingApproval() {
    return this.adminService.getCompaniesPendingApproval();
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  @Patch('companies/:id')
  async updateCompany(
    @Param('id') id: string,
    @Body() body: UpdateAdminCompanyDto,
  ) {
    return this.adminService.updateCompany(id, body);
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    return this.adminService.deleteCompany(id);
  }

  // ─── Clinics ─────────────────────────────────────────────────────────────
  @Get('clinics')
  async getClinics(@Query('environment') environment?: string) {
    return this.adminService.getClinics(this.parseEnvironment(environment));
  }

  @Get('clinics/:id')
  async getClinic(@Param('id') id: string) {
    return this.adminService.getClinicById(id);
  }

  @Post('clinics')
  async createClinic(
    @Body()
    body: {
      name: string;
      cnpj: string;
      city?: string;
      state?: string;
      address?: string;
      email?: string;
      environment?: DataEnvironment;
    },
  ) {
    return this.adminService.createClinic({
      ...body,
      environment: this.parseEnvironment(body.environment),
    });
  }

  @Patch('clinics/:id')
  async updateClinic(
    @Param('id') id: string,
    @Body() body: UpdateAdminClinicDto,
  ) {
    return this.adminService.updateClinic(id, body);
  }

  @Delete('clinics/:id')
  async deleteClinic(@Param('id') id: string) {
    return this.adminService.deleteClinic(id);
  }

  @Patch('clinics/:id/matriz')
  async setClinicAsMatriz(
    @Param('id') id: string,
    @Body() body: SetMatrizClinicDto,
  ) {
    return this.adminService.setClinicAsMatriz(id, body.setAsMatriz);
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────
  @Get('doctors')
  async getDoctors(@Query('environment') environment?: string) {
    return this.adminService.getDoctors(this.parseEnvironment(environment));
  }

  @Get('doctors/:id')
  async getDoctor(@Param('id') id: string) {
    return this.adminService.getDoctorById(id);
  }

  @Post('doctors')
  async createDoctor(
    @Body()
    body: {
      name: string;
      gender?: string;
      crmNumber: string;
      crmState: string;
      city?: string;
      state?: string;
      specialties?: string;
      email?: string;
      environment?: DataEnvironment;
    },
  ) {
    return this.adminService.createDoctor({
      ...body,
      environment: this.parseEnvironment(body.environment),
    });
  }

  @Patch('doctors/:id')
  async updateDoctor(
    @Param('id') id: string,
    @Body() body: UpdateAdminDoctorDto,
  ) {
    return this.adminService.updateDoctor(id, body);
  }

  @Post('doctors/:id/verify')
  async verifyDoctor(@Param('id') id: string) {
    return this.adminService.verifyDoctor(id);
  }

  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    return this.adminService.deleteDoctor(id);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // ─── Document Approval ────────────────────────────────────────────────────
  @Post('companies/:id/approve')
  async approveCompanyDocumentation(
    @Param('id') companyId: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.adminService.approveCompanyDocumentation(
      companyId,
      body.approvedBy,
    );
  }
}
