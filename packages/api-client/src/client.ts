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

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const res = await globalThis.fetch(url, {
      ...options,
      headers: { ...this.getAuthHeaders(), ...(options.headers as Record<string, string> ?? {}) },
    });

    if (res.status === 401) {
      clearSession(this.storage);
      console.warn(`[apiClient] 401 em ${path} — auth desabilitada`);
      return { data: null, success: false };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string })?.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async fetchWithFormData(path: string, formData: FormData): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const token = getAuthToken(this.storage);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await globalThis.fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

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
