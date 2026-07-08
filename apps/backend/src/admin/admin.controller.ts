import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Companies ────────────────────────────────────────────────────────────
  @Public()
  @Get('companies')
  async getCompanies(@Query('status') status?: string) {
    return this.adminService.getCompanies(status);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('companies/pending-approval')
  async getCompaniesPendingApproval() {
    return this.adminService.getCompaniesPendingApproval();
  }

  @Public()
  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  @Public()
  @Patch('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCompany(id, body);
  }

  @Public()
  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    return this.adminService.deleteCompany(id);
  }

  // ─── Clinics ─────────────────────────────────────────────────────────────
  @Public()
  @Get('clinics')
  async getClinics() {
    return this.adminService.getClinics();
  }

  @Public()
  @Get('clinics/:id')
  async getClinic(@Param('id') id: string) {
    return this.adminService.getClinicById(id);
  }

  @Public()
  @Post('clinics')
  async createClinic(@Body() body: any) {
    return this.adminService.createClinic(body);
  }

  @Public()
  @Patch('clinics/:id')
  async updateClinic(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateClinic(id, body);
  }

  @Public()
  @Delete('clinics/:id')
  async deleteClinic(@Param('id') id: string) {
    return this.adminService.deleteClinic(id);
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────
  @Public()
  @Get('doctors')
  async getDoctors() {
    return this.adminService.getDoctors();
  }

  @Public()
  @Get('doctors/:id')
  async getDoctor(@Param('id') id: string) {
    return this.adminService.getDoctorById(id);
  }

  @Public()
  @Post('doctors')
  async createDoctor(@Body() body: { name: string; crmNumber: string; crmState: string; city?: string; state?: string; specialties?: string; email?: string }) {
    return this.adminService.createDoctor(body);
  }

  @Public()
  @Patch('doctors/:id')
  async updateDoctor(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateDoctor(id, body);
  }

  @Public()
  @Post('doctors/:id/verify')
  async verifyDoctor(@Param('id') id: string) {
    return this.adminService.verifyDoctor(id);
  }

  @Public()
  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    return this.adminService.deleteDoctor(id);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  @Public()
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // ─── Document Approval ────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('companies/:id/approve')
  async approveCompanyDocumentation(
    @Param('id') companyId: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.adminService.approveCompanyDocumentation(companyId, body.approvedBy);
  }
}
