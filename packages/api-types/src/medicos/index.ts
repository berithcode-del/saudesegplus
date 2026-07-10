export interface UpdateDoctorProfileRequest {
  city?: string;
  state?: string;
  phone?: string;
  contactEmail?: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  gender?: string;
  crmNumber: string;
  crmState: string;
  phone?: string;
  contactEmail?: string;
  signaturePin?: string;
  city?: string;
  state?: string;
  rqeNumber?: string;
  specialties?: string;
  status: string;
  verifiedAt?: string;
}

export interface DoctorListItem {
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

export interface DoctorListResponse {
  data: DoctorListItem[];
}

export interface MedicoSolicitacaoResponse {
  id: string;
  patientName: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patientCpf?: string;
}

export interface MedicoSolicitacoesResponse {
  data: MedicoSolicitacaoResponse[];
}

export type { UpdateDoctorProfileRequest as UpdateDoctorProfileDto };
