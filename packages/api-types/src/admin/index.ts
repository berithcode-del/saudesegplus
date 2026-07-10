import type { SupportTicketStatus } from '../enums/index.js';

export interface AdminStatsResponse {
  totalCompanies: number;
  totalDoctors: number;
  totalPatients: number;
  totalExamRequests: number;
  pendingApproval: number;
  totalRevenue?: number;
}

export interface AdminClinic {
  id: string;
  name: string;
  cnpj: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  contactEmail?: string;
  isActive: boolean;
  isFranchise: boolean;
}

export interface AdminClinicListResponse {
  data: AdminClinic[];
}

export interface AdminCreateClinicRequest {
  name: string;
  cnpj: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  contactEmail?: string;
}

export interface AdminDoctor {
  id: string;
  name: string;
  crmNumber: string;
  crmState: string;
  city?: string;
  state?: string;
  specialties?: string;
  status: string;
  verifiedAt?: string;
}

export interface AdminDoctorListResponse {
  data: AdminDoctor[];
}

export interface AdminCreateDoctorRequest {
  name: string;
  gender?: string;
  crmNumber: string;
  crmState: string;
  city?: string;
  state?: string;
  specialties?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  userProfile: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  userProfile: string;
  companyId?: string;
  clinicId?: string;
  doctorId?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SupportTicketListResponse {
  data: SupportTicket[];
}

export interface SupportTicketDetailResponse {
  data: SupportTicket & {
    messages: Array<{
      id: string;
      content: string;
      authorId: string;
      authorRole: string;
      createdAt: string;
    }>;
  };
}

export type {
  AdminCreateClinicRequest as AdminCreateClinicDto,
  AdminCreateDoctorRequest as AdminCreateDoctorDto,
  CreateTicketRequest as CreateTicketDto,
  SendMessageRequest as SendMessageDto,
};
