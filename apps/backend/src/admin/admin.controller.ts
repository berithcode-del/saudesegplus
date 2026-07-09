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
} from './dto/update-admin-profiles.dto';
import { CompanyStatus } from '@prisma/client';

@Controller('api/admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Companies ────────────────────────────────────────────────────────────
  @Get('companies')
  async getCompanies(@Query('status') status?: CompanyStatus) {
    return this.adminService.getCompanies(status);
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
  async getClinics() {
    return this.adminService.getClinics();
  }

  @Get('clinics/:id')
  async getClinic(@Param('id') id: string) {
    return this.adminService.getClinicById(id);
  }

  @Post('clinics')
  async createClinic(@Body() body: any) {
    return this.adminService.createClinic(body);
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

  // ─── Doctors ─────────────────────────────────────────────────────────────
  @Get('doctors')
  async getDoctors() {
    return this.adminService.getDoctors();
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
      crmNumber: string;
      crmState: string;
      city?: string;
      state?: string;
      specialties?: string;
      email?: string;
    },
  ) {
    return this.adminService.createDoctor(body);
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
