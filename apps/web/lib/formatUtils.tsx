/**
 * ===========================================================================
 * formatUtils.ts — Máscaras, validações e constantes para formulários
 * ===========================================================================
 * 
 * Este módulo centraliza todas as funções de formatação (máscaras), validação
 * e constantes usadas nos formulários do frontend.
 * 
 * IMPORTANTE: As máscaras são aplicadas apenas no frontend. Antes de enviar
 * os dados para o backend, SEMPRE use as funções `onlyDigits()` ou
 * `cleanForBackend()` para remover a formatação. O banco de dados armazena
 * apenas dígitos (ex.: CPF como "12345678900", telefone como "11999998888").
 * 
 * Medidas anti-saturação:
 * - Todos os campos de texto livre têm maxLength definido.
 * - CPF, CNPJ, telefone, CEP têm máscara + maxLength implícito.
 * - Estados (UF) usam sempre dropdown com lista pré-definida.
 * - Campos numéricos têm min/max onde aplicável.
 * ===========================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/** Lista de todos os estados (UFs) brasileiros */
export const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

/** Limites de caracteres para campos comuns */
export const FIELD_LIMITS = {
  CPF: 14,           // "000.000.000-00" (14 chars com máscara)
  CNPJ: 18,          // "00.000.000/0000-00" (18 chars com máscara)
  PHONE: 15,         // "(00) 00000-0000" (15 chars com máscara)
  CEP: 9,            // "00000-000" (9 chars com máscara)
  EMAIL: 254,        // RFC 5321
  NAME: 100,         // Nome completo
  RAZAO_SOCIAL: 150, // Razão social
  NOME_FANTASIA: 100,// Nome fantasia
  ADDRESS: 200,      // Endereço
  CITY: 100,         // Cidade
  CRM_NUMBER: 20,    // Número de CRM
  SPECIALTIES: 200,  // Especialidades
  PASSWORD: 128,     // Senha
  PASSWORD_MIN: 6,   // Senha mínima
  NOTES: 500,        // Anotações clínicas / observações
  DESCRIPTION: 200,  // Descrições gerais
  QUESTIONARIO: 1000,// Campos de questionário de saúde
  EXAM_VALUE: 20,     // Valores de exames (pressão, glicemia, etc.)
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES DE LIMPEZA
// ─────────────────────────────────────────────────────────────────────────────

/** Remove tudo que não for dígito (0-9) */
export function onlyDigits(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/** Remove todos os espaços em branco no início e fim + normaliza espaços internos */
export function trimAndNormalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Prepara um valor formatado para envio ao backend.
 * Remove máscara (deixa só dígitos) para CPF, CNPJ, telefone, CEP.
 * Para outros campos, apenas trim.
 */
export function cleanForBackend(value: string, type: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'text' = 'text'): string {
  if (type === 'text') return trimAndNormalize(value);
  return onlyDigits(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// MÁSCARAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Máscara de CPF: 000.000.000-00
 * Aceita entrada parcial (ex.: "123.456." enquanto digita).
 */
export function maskCPF(value: string): string {
  const clean = onlyDigits(value).slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Máscara de CNPJ: 00.000.000/0000-00
 * Aceita entrada parcial.
 */
export function maskCNPJ(value: string): string {
  const clean = onlyDigits(value).slice(0, 14);
  return clean
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Máscara de telefone: (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo)
 * Detecta automaticamente se é celular (11 dígitos) ou fixo (10 dígitos).
 */
export function maskPhone(value: string): string {
  const clean = onlyDigits(value).slice(0, 11);
  if (clean.length <= 10) {
    // Fixo: (00) 0000-0000
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  // Celular: (00) 00000-0000
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Máscara de CEP: 00000-000
 */
export function maskCEP(value: string): string {
  const clean = onlyDigits(value).slice(0, 8);
  return clean
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

/** Valida formato de CPF (11 dígitos + dígitos verificadores) */
export function isValidCPF(cpf: string | undefined): boolean {
  const clean = onlyDigits(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Todos iguais = inválido

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(clean[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== Number(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(clean[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== Number(clean[10])) return false;

  return true;
}

/** Valida formato de CNPJ (14 dígitos + dígitos verificadores) */
export function isValidCNPJ(cnpj: string | undefined): boolean {
  const clean = onlyDigits(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const calc = (len: number): number => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(clean[i]) * weights[i];
    const rev = sum % 11;
    return rev < 2 ? 0 : 11 - rev;
  };

  if (calc(12) !== Number(clean[12])) return false;
  if (calc(13) !== Number(clean[13])) return false;

  return true;
}

/** Valida formato de email (RFC 5322 simplified) */
export function isValidEmail(email: string | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? '').trim());
}

/** Valida telefone (10 ou 11 dígitos) */
export function isValidPhone(phone: string | undefined): boolean {
  const clean = onlyDigits(phone);
  return clean.length === 10 || clean.length === 11;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: OPTIONS DE ESTADOS (para uso em <select>)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renderiza as opções de estados para um <select>.
 * Uso:
 *   <select ...>
 *     <option value="">Selecione</option>
 *     {BR_STATE_OPTIONS}
 *   </select>
 */
export const BR_STATE_OPTIONS = BR_STATES.map(uf => (
  <option key={uf} value={uf}>{uf}</option>
));
