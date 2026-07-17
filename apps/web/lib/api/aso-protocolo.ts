import { apiFetch } from '../api';
import type {
  ProtocoloASO,
  ProtocoloListResponse,
  CreateProtocoloDto,
  UpdateProtocoloDto,
  ProtocoloQueryDto,
  ProtocoloEstatisticas,
} from '@/lib/types/aso-protocolo';

const buildQuery = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export const asoProtocoloApi = {
  async create(data: CreateProtocoloDto): Promise<ProtocoloASO> {
    const res = await apiFetch('/aso/protocolos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async list(query: ProtocoloQueryDto = {}): Promise<ProtocoloListResponse> {
    const qs = buildQuery(query);
    const res = await apiFetch(`/aso/protocolos?${qs}`);
    return res;
  },

  async getByNumero(numeroProtocolo: string): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/busca/${encodeURIComponent(numeroProtocolo)}`);
    return res;
  },

  async getById(id: string): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/${id}`);
    return res;
  },

  async update(id: string, data: UpdateProtocoloDto): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res;
  },

  async delete(id: string): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  async getEstatisticas(empresaId?: string, clinicaId?: string): Promise<ProtocoloEstatisticas> {
    const params = new URLSearchParams();
    if (empresaId) params.set('empresaId', empresaId);
    if (clinicaId) params.set('clinicaId', clinicaId);
    const res = await apiFetch(`/aso/protocolos/estatisticas?${params.toString()}`);
    return res;
  },

  // Admin endpoints
  async adminGetById(id: string): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/admin/${id}`);
    return res;
  },

  async adminUpdate(id: string, data: UpdateProtocoloDto & { numeroProtocolo?: string }): Promise<ProtocoloASO> {
    const res = await apiFetch(`/aso/protocolos/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res;
  },

  async adminDelete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`/aso/protocolos/admin/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};