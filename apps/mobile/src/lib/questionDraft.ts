import localforage from 'localforage';

export type TabagismoOption = 'NUNCA' | 'FUMante' | 'EX_FUMANTE' | '';
export type AlcoolOption = 'NAO' | 'OCASIONAL' | 'FREQUENTE' | '';

export interface QuestionDraft {
  queixas: string;
  doencasPrevias: string;
  medicamentosEmUso: string;
  alergiasConhecidas: string;
  cirurgiasPrevias: string;
  observacoes: string;
  tabagismo: TabagismoOption;
  tabagismoDetalhe: string;
  alcool: AlcoolOption;
  alcoolDetalhe: string;
  atividadeFisica: string;
  sono: string;
  declaracaoVeracidade: boolean;
}

export const EMPTY_DRAFT: QuestionDraft = {
  queixas: '',
  doencasPrevias: '',
  medicamentosEmUso: '',
  alergiasConhecidas: '',
  cirurgiasPrevias: '',
  observacoes: '',
  tabagismo: '',
  tabagismoDetalhe: '',
  alcool: '',
  alcoolDetalhe: '',
  atividadeFisica: '',
  sono: '',
  declaracaoVeracidade: false,
};

const store = localforage.createInstance({ name: 'saudeseg', storeName: 'question_draft' });

export async function saveDraft(token: string, draft: QuestionDraft): Promise<void> {
  await store.setItem(`draft_${token}`, draft);
}

export async function loadDraft(token: string): Promise<QuestionDraft | null> {
  return (await store.getItem<QuestionDraft>(`draft_${token}`)) ?? null;
}

export async function clearDraft(token: string): Promise<void> {
  await store.removeItem(`draft_${token}`);
}
