import type { DocumentType, TabagismoOption, AlcoolOption } from '../enums/index.js';

export interface AuthPortalRequest {
  token: string;
  cpf: string;
  birthDate: string;
}

export interface AuthPortalResponse {
  access_token: string;
  token?: string;
  patientId: string;
  examRequestId: string;
  examType: string;
  roleFunction: string;
}

export interface ConfirmarDadosRequest {
  phone?: string;
  email?: string;
}

export interface ConfirmarDadosResponse {
  success: boolean;
  message?: string;
}

export interface QuestionarioRequest {
  queixas?: string;
  doencasPrevias?: string;
  medicamentosEmUso?: string;
  alergiasConhecidas?: string;
  cirurgiasPrevias?: string;
  observacoes?: string;
  tabagismo?: TabagismoOption;
  tabagismoDetalhe?: string;
  alcool?: AlcoolOption;
  alcoolDetalhe?: string;
  atividadeFisica?: string;
  sono?: string;
  declaracaoVeracidade?: boolean;
}

export interface QuestionarioResponse {
  success: boolean;
  message?: string;
}

export interface EnviarDocumentoRequest {
  tipo: DocumentType;
  fileUrl: string;
}

export interface EnviarDocumentoResponse {
  success: boolean;
  message?: string;
  documentId?: string;
}

export interface PortalDocument {
  id: string;
  tipo: DocumentType;
  fileUrl: string;
  originalName?: string;
  uploadedAt: string;
}

export interface PortalDocumentListResponse {
  data: PortalDocument[];
}

export interface PortalStatusResponse {
  step: string;
  examRequestId: string;
  patientName: string;
  examType: string;
  roleFunction: string;
}

export type {
  AuthPortalRequest as AuthPortalDto,
  ConfirmarDadosRequest as ConfirmarDadosDto,
  QuestionarioRequest as QuestionarioDto,
  EnviarDocumentoRequest as EnviarDocumentoDto,
};
