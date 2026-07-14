import type { StorageAdapter } from './storage/types';
import { getAuthToken, clearSession } from './auth';
import { getBaseUrl } from './config';

export interface ApiClientConfig {
  storage: StorageAdapter;
  baseUrl?: string;
}

export class ApiClient {
  private storage: StorageAdapter;
  private baseUrl: string;

  constructor(config: ApiClientConfig) {
    this.storage = config.storage;
    this.baseUrl = config.baseUrl ?? getBaseUrl();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getAuthToken(this.storage);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private toNetworkError(error: unknown): Error {
    if (error instanceof TypeError) {
      return new Error(
        `Nao foi possivel conectar ao backend em ${this.baseUrl}. Verifique se o backend esta no ar e se a URL/CORS estao configurados corretamente.`,
      );
    }
    return error instanceof Error ? error : new Error('Falha de rede ao conectar com o backend.');
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
      const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
      let res: Response;
      try {
        res = await globalThis.fetch(url, {
          ...options,
          headers: { ...this.getAuthHeaders(), ...(options.headers as Record<string, string> ?? {}) },
        });
      } catch (error) {
        throw this.toNetworkError(error);
      }

      if (res.status === 401) {
        clearSession(this.storage);
        console.warn(`[apiClient] 401 em ${path} — auth desabilitada`);
        return { data: null, success: false };
      }

      // Check Content-Type before parsing JSON to avoid "Unexpected token '<'" errors
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!res.ok) {
        const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
        const message = isJson && typeof body === 'object' ? (body as { message?: string })?.message : body?.toString();
        throw new Error(message || `HTTP ${res.status}`);
      }

      if (!isJson) {
        const text = await res.text().catch(() => '');
        throw new Error(`Resposta inesperada do servidor (não-JSON): ${text.slice(0, 200)}`);
      }

      return res.json();
    }

  async fetchWithFormData(path: string, formData: FormData): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const token = getAuthToken(this.storage);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await globalThis.fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (error) {
      throw this.toNetworkError(error);
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Falha ao enviar');
    if (json?.success === false) throw new Error(json?.message || 'Falha ao enviar');
    return json;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAuthToken(): string | null {
    return getAuthToken(this.storage);
  }
}
