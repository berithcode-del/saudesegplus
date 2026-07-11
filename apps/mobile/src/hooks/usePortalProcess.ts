import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from '../app/providers/ApiProvider';

export interface PortalProcessData {
  id: string;
  status: string;
  proximaAcao: {
    tipo: string;
    titulo: string;
    descricao: string;
    cta: string;
    ctaUrl: string;
    endereco: string | null;
  };
  empresa: { nome: string };
  paciente: {
    nome: string;
    cpf: string;
    birthDate: string;
    phone: string;
    email: string | null;
  };
  documentos: { tipo: string; enviado: boolean; fileUrl: string | null }[];
  questionario: { respondido: boolean };
  teleconsulta: { disponivel: boolean; linkSala: string | null };
  aso: { disponivel: boolean; pdfUrl: string | null; decision: string | null; validUntil: string | null };
  timeline: { eventType: string; occurredAt: string; metadata: any }[];
  progresso: any;
}

interface State {
  data: PortalProcessData | null;
  loading: boolean;
  error: string | null;
}

export function usePortalProcess(autoFetch = true) {
  const apiClient = useApiClient();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  const fetchProcess = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = (await apiClient.fetch('/api/portal/processo')) as PortalProcessData;
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar processo';
      setState({ data: null, loading: false, error: msg });
      return null;
    }
  }, [apiClient]);

  useEffect(() => {
    if (autoFetch) {
      fetchProcess();
    }
  }, [autoFetch, fetchProcess]);

  return { ...state, refetch: fetchProcess };
}
