export interface Anamnese {
  id: string;
  patientId: string;
  queixas?: string;
  historicoOcupacional?: string;
  historicoMedico?: string;
  medicamentos?: string;
  habitos?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnamneseRequest {
  patientId: string;
  queixas?: string;
  historicoOcupacional?: string;
  historicoMedico?: string;
  medicamentos?: string;
  habitos?: string;
}

export interface AnamneseListResponse {
  data: Anamnese[];
}
