export type StatusProtocolo =
  | 'AGUARDANDO_COLETA'
  | 'EM_COLETA'
  | 'NA_FILA_MEDICA'
  | 'EM_ATENDIMENTO'
  | 'DOCUMENTOS_PENDENTES'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type TipoExame =
  | 'ADMISSIONAL'
  | 'PERIODICO'
  | 'DEMISSIONAL'
  | 'MUDANCA_FUNCAO'
  | 'RETORNO_TRABALHO';

export interface DocumentoProtocolo {
  id: string;
  tipo: string;
  url: string;
  data: string;
  descricao?: string;
}

export interface HistoricoProtocolo {
  acao: string;
  de: any;
  para: any;
  userId: string;
  timestamp: string;
}

export interface ProtocoloASO {
  id: string;
  numeroProtocolo: string;
  empresaId: string;
  clinicaId?: string;
  pacienteId: string;
  medicoId?: string;
  examRequestId?: string;
  status: StatusProtocolo;
  tipoExame: TipoExame;
  dataAbertura: string;
  dataConclusao?: string;
  documentos: DocumentoProtocolo[];
  historico: HistoricoProtocolo[];
  observacoes?: string;
  empresa?: { id: string; nomeFantasia?: string; razaoSocial?: string; name?: string };
  clinica?: { id: string; name: string };
  paciente?: { id: string; name: string; cpf: string };
  medico?: { id: string; name: string; crmNumber: string; crmState: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProtocoloListResponse {
  data: ProtocoloASO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProtocoloDto {
  empresaId: string;
  clinicaId: string;
  pacienteId: string;
  tipoExame: TipoExame;
  observacoes?: string;
}

export interface UpdateProtocoloDto {
  status?: StatusProtocolo;
  medicoId?: string;
  observacoes?: string;
  documentos?: DocumentoProtocolo[];
}

export interface ProtocoloQueryDto {
  numeroProtocolo?: string;
  empresaId?: string;
  clinicaId?: string;
  pacienteId?: string;
  medicoId?: string;
  status?: StatusProtocolo;
  tipoExame?: TipoExame;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}

export interface ProtocoloEstatisticas {
  porStatus: { status: StatusProtocolo; _count: { status: number } }[];
  porTipo: { tipoExame: TipoExame; _count: { tipoExame: number } }[];
  total: number;
}