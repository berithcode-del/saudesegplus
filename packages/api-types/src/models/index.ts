import type {
  Role,
  InviteStatus,
  ExamSource,
  ExamResultSource,
  FinancialType,
  FinancialCategory,
  PaymentStatus,
  SupportTicketStatus,
} from '../enums/index.js';

export interface UserAccount {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  cpf: string;
  name: string;
  birthDate?: string;
  phone?: string;
  functionCboCode?: string;
  status: string;
  createdAt: string;
}

export interface ExamInvite {
  id: string;
  token: string;
  companyId: string;
  expectedCpf?: string;
  expectedEmail?: string;
  roleFunction: string;
  roleFunctionCboCode?: string;
  examType: string;
  status: InviteStatus;
  expiresAt: string;
  sentAt: string;
  openedAt?: string;
  collaboratorName?: string;
  expectedBirthDate?: string;
}

export interface ExamRequestModel {
  id: string;
  patientId: string;
  clinicId?: string;
  inviteId?: string;
  source: ExamSource;
  examPurpose: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTypeModel {
  id: string;
  name: string;
  category: string;
  requiresEquipment: boolean;
  canBeRemoteReview: boolean;
  validityDays: number;
}

export interface ExamResult {
  id: string;
  requestId: string;
  typeId: string;
  valueJson: string;
  attachmentUrl?: string;
  collectedById?: string;
  performedByType: 'OPERATOR' | 'DOCTOR' | 'CLINIC_ADMIN';
  performedById: string;
  performedByName: string;
  actorSessionId?: string;
  collectedAt: string;
  source: ExamResultSource;
}

export interface OccupationalRisk {
  id: string;
  cboCode: string;
  functionName: string;
  riskGrade: string;
  requiresInPerson: boolean;
  requiredExams: string[];
  periodicFrequencyMonths: number;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  requestId: string;
  tipo: string;
  fileUrl: string;
  originalName: string;
  uploadedAt: string;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  type: string;
  fileUrl: string;
  originalName: string;
  uploadedAt: string;
  validUntil?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  doctorId?: string;
  companyId?: string;
  clinicId?: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: FinancialType;
  category: FinancialCategory;
  description: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
  notes?: string;
  examRequestId?: string;
  clinicId?: string;
  doctorId?: string;
  companyId?: string;
  servicePriceId?: string;
  transactionDate: string;
  paidAt?: string;
}

export interface CboSearchResult {
  code: string;
  name: string;
}

export interface CboSearchResponse {
  data: CboSearchResult[];
}

export interface UploadDocumentResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  message?: string;
}
