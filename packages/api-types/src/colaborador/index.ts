export interface ValidateInviteRequest {
  token: string;
  name: string;
  password: string;
}

export interface ValidateInviteResponse {
  success: boolean;
  message?: string;
  patientId?: string;
  examRequestId?: string;
}

export interface ColaboradorSolicitacaoResponse {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  doctorName?: string;
  clinicName?: string;
}

export interface ColaboradorSolicitacoesListResponse {
  data: ColaboradorSolicitacaoResponse[];
}

export type { ValidateInviteRequest as ValidateInviteDto };
