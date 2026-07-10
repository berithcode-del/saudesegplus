import type { CompanyStatus, ExamPurpose } from '../enums/index.js';

export interface CreateCompanyRequest {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  address?: string;
  cep?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  contactEmail: string;
  password?: string;
}

export interface UpdateCompanyRequest {
  nomeFantasia?: string;
  address?: string;
  cep?: string;
  city?: string;
  state?: string;
  phone?: string;
  contactEmail?: string;
}

export interface Company {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  name?: string;
  planType?: string;
  address?: string;
  cep?: string;
  city?: string;
  state?: string;
  phone?: string;
  contactEmail?: string;
  status: CompanyStatus;
  clinicId?: string;
  pcmsoDocumentUrl?: string;
  ppraDocumentUrl?: string;
  pcmsoValidUntil?: string;
  ppraValidUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListResponse {
  data: Company[];
}

export interface CreateInviteRequest {
  expectedCpf: string;
  expectedEmail: string;
  expectedBirthDate?: string;
  roleFunction: string;
  roleFunctionCboCode?: string;
  examType: ExamPurpose;
  collaboratorName?: string;
  expiresInDays?: number;
}

export interface CompanyStatusCheckResponse {
  pcmsoValid: boolean;
  ppraValid: boolean;
  pcmsoValidUntil?: string;
  ppraValidUntil?: string;
  pendingDocuments: string[];
}

export type {
  CreateCompanyRequest as CreateCompanyDto,
  UpdateCompanyRequest as UpdateCompanyDto,
  CreateInviteRequest as CreateInviteDto,
};
