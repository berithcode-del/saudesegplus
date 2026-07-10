export type Role =
  | 'ADMIN'
  | 'OPERATOR'
  | 'DOCTOR'
  | 'PATIENT'
  | 'COMPANY_ADMIN'
  | 'CLINIC';

export type CompanyStatus =
  | 'CADASTRO_INCOMPLETO'
  | 'EM_ANALISE'
  | 'LIBERADA'
  | 'DOCUMENTACAO_VENCIDA';

export type InviteStatus = 'ENVIADO' | 'ABERTO' | 'EXPIRADO' | 'CONCLUIDO';

export type TimelineEventType =
  | 'LINK_ENVIADO'
  | 'LINK_ABERTO'
  | 'CADASTRO_CONCLUIDO'
  | 'COLABORADOR_CADASTRADO'
  | 'EXAME_INICIADO'
  | 'EM_ATENDIMENTO_MEDICO'
  | 'CONCLUIDO'
  | 'DADOS_CONFIRMADOS'
  | 'DOCUMENTOS_ENVIADOS'
  | 'QUESTIONARIO_RESPONDIDO'
  | 'TELECONSULTA_INICIADA';

export type FinancialType = 'RECEITA' | 'DESPESA' | 'REPASSE';

export type FinancialCategory =
  | 'EXAME_ASO'
  | 'HONORARIO_MEDICO'
  | 'TAXA_CLINICA'
  | 'CUSTO_OPERACIONAL'
  | 'OUTROS';

export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ESTORNADO';

export type SupportTicketStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO';

export type ExamPurpose =
  | 'admissional'
  | 'periodico'
  | 'demissional'
  | 'mudanca_funcao'
  | 'retorno';

export type QueueEntryStatus = 'WAITING' | 'ACCEPTED' | 'COMPLETED';

export type DoctorStatus = 'offline' | 'online';

export type ExamRequestStatus =
  | 'DADOS_CONFIRMADOS'
  | 'DOCUMENTOS_ENVIADOS'
  | 'QUESTIONARIO_RESPONDIDO'
  | 'EM_ATENDIMENTO_MEDICO'
  | 'CONCLUIDO';

export type DocumentType = 'rg' | 'cnh' | 'foto' | 'outro';

export type TabagismoOption = 'nao' | 'sim' | 'ex';

export type AlcoolOption = 'nao' | 'social' | 'frequente';

export type Gender = 'male' | 'female';

export type ExamSource = 'direto' | 'convite_empresa';

export type ExamResultSource = 'manual' | 'automated';

export const RoleEnum: Record<Role, Role> = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  CLINIC: 'CLINIC',
};

export const CompanyStatusEnum: Record<CompanyStatus, CompanyStatus> = {
  CADASTRO_INCOMPLETO: 'CADASTRO_INCOMPLETO',
  EM_ANALISE: 'EM_ANALISE',
  LIBERADA: 'LIBERADA',
  DOCUMENTACAO_VENCIDA: 'DOCUMENTACAO_VENCIDA',
};

export const InviteStatusEnum: Record<InviteStatus, InviteStatus> = {
  ENVIADO: 'ENVIADO',
  ABERTO: 'ABERTO',
  EXPIRADO: 'EXPIRADO',
  CONCLUIDO: 'CONCLUIDO',
};

export const ExamPurposeEnum: Record<ExamPurpose, ExamPurpose> = {
  admissional: 'admissional',
  periodico: 'periodico',
  demissional: 'demissional',
  mudanca_funcao: 'mudanca_funcao',
  retorno: 'retorno',
};

export const QueueEntryStatusEnum: Record<QueueEntryStatus, QueueEntryStatus> = {
  WAITING: 'WAITING',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
};

export const ExamRequestStatusEnum: Record<ExamRequestStatus, ExamRequestStatus> = {
  DADOS_CONFIRMADOS: 'DADOS_CONFIRMADOS',
  DOCUMENTOS_ENVIADOS: 'DOCUMENTOS_ENVIADOS',
  QUESTIONARIO_RESPONDIDO: 'QUESTIONARIO_RESPONDIDO',
  EM_ATENDIMENTO_MEDICO: 'EM_ATENDIMENTO_MEDICO',
  CONCLUIDO: 'CONCLUIDO',
};
