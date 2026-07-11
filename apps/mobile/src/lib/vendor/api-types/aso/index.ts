export interface AsoDocument {
  id: string;
  requestId: string;
  doctorId: string;
  decision: string;
  restrictionNotes?: string;
  pdfUrl?: string;
  signatureProviderId?: string;
  signedAt?: string;
  validUntil?: string;
}

export interface AsoListResponse {
  data: AsoDocument[];
}

export interface AsoDetailResponse {
  data: AsoDocument;
}

export interface CreateAsoRequest {
  requestId: string;
  doctorId: string;
  decision: string;
  restrictionNotes?: string;
}

export interface UpdateSolicitacaoRequest {
  status: string;
  laudoTexto?: string;
  decision: string;
  restrictionNotes?: string;
}

export interface SolicitacaoResponse {
  id: string;
  patientName: string;
  patientCpf: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clinicName?: string;
  results?: Array<{
    id: string;
    typeName: string;
    valueJson: string;
    collectedAt: string;
  }>;
}

export interface SolicitacaoListResponse {
  data: SolicitacaoResponse[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
