export type TourPerfil = 'EMPRESA' | 'CLINICA' | 'MEDICO';
export type TourPosicao = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  id: string;
  titulo: string;
  texto: string;
  anchorSelector?: string;
  posicao: TourPosicao;
  route?: string;
  image?: string;
}

export interface FaqItem {
  pergunta: string;
  resposta: string;
}

export interface Tutorial {
  id: string;
  perfil: TourPerfil;
  titulo: string;
  steps: TourStep[];
  faq: FaqItem[];
  ativo: boolean;
}
