'use client';
import { useEffect, useState } from 'react';
import { apiListSolicitacoes, apiFetch, apiGetRequiredExams, apiCreateInvite, apiCancelInvite } from '../../lib/api';
import { Pagination } from '../../../components/ui/Pagination';
import { PlusIcon, ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import CboAutocomplete from '../../../components/ui/CboAutocomplete';

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patient: { name: string; cpf: string };
  asoDocuments?: Array<{ decision: string }>;
  token?: string;
}

export default function EmpresaSolicitacoesPage() {
  const [companyId, setCompanyId] = useState('');
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    collaboratorName: '',
    expectedCpf: '',
    expectedEmail: '',
    expectedBirthDate: '',
    roleFunction: '',
    roleFunctionCboCode: '',
    examType: 'admissional',
    expiresInDays: 7,
  });
  const [inviteToken, setInviteToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [requiredExams, setRequiredExams] = useState<string[]>([]);
  const [createError, setCreateError] = useState('');

  // Busca o companyId do token ou localStorage
  useEffect(() => {
    const fetchCompanyId = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      let cid: string | null = null;

      if (token) {
        try {
          const parts = token.split('.');
          const payload = JSON.parse(atob(parts[1] ?? ''));
          cid = payload?.profileId || payload?.companyId;
        } catch (err) {
          console.error('Erro ao decodificar token:', err);
        }
      }

      if (!cid) {
        cid = localStorage.getItem('companyId');
      }

      if (!cid) {
        try {
          const result = await apiFetch(`/api/company`) as any;
          if (result.data && result.data.length > 0) {
            cid = result.data[0].id;
            localStorage.setItem('companyId', cid as string);
          }
        } catch (err) {
          console.error('Erro ao buscar company ID', err);
        }
      }

      if (cid) {
        localStorage.setItem('companyId', cid);
        setCompanyId(cid);
      }
    };
    fetchCompanyId();
  }, []);

  // Carrega solicitações quando companyId muda
  useEffect(() => {
    if (!companyId) return;
    const loadSolicitacoes = async () => {
      setLoading(true);
      try {
        const result = await apiListSolicitacoes({ companyId }, page) as any;
        // Backend retorna: { success, data: { data: [], pagination: { totalPages, total, ... } } }
        const items = Array.isArray(result?.data?.data)
          ? result.data.data
          : Array.isArray(result?.data)
          ? result.data
          : [];
        const pag = result?.data?.pagination ?? result?.pagination ?? {};
        setSolicitacoes(items);
        setTotalPages(pag?.totalPages ?? 1);
        setTotal(pag?.total ?? 0);
      } catch (err) {
        console.error('Erro ao carregar solicitações:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSolicitacoes();
  }, [companyId, page]);

  // Ao selecionar CBO, busca exames obrigatórios
  const handleCboSelect = async (cboCode: string, functionName: string) => {
    setInviteData(prev => ({ ...prev, roleFunctionCboCode: cboCode, roleFunction: functionName }));
    if (!cboCode) { setRequiredExams([]); return; }
    try {
      const result = await apiGetRequiredExams(cboCode) as any;
      const exams: string[] = result?.data?.requiredExams ?? result?.requiredExams ?? [];
      setRequiredExams(exams);
    } catch {
      setRequiredExams([]);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { setCreateError('ID da empresa não encontrado. Faça login novamente.'); return; }
    setCreating(true);
    setCreateError('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const result = await apiCreateInvite(companyId, {
        collaboratorName: inviteData.collaboratorName,
        expectedCpf: inviteData.expectedCpf,
        expectedEmail: inviteData.expectedEmail,
        expectedBirthDate: inviteData.expectedBirthDate || undefined,
        roleFunction: inviteData.roleFunction,
        roleFunctionCboCode: inviteData.roleFunctionCboCode,
        examType: inviteData.examType,
        expiresInDays: Number(inviteData.expiresInDays),
      }) as any;

      const token = result?.data?.token ?? result?.token;
      if (token) {
        setInviteToken(token);
      } else {
        const msg = result?.data?.message ?? result?.message ?? '';
        throw new Error(msg || 'Convite criado, mas token não retornado. Verifique o status da empresa.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setCreateError('O servidor demorou muito para responder. Tente novamente.');
      } else {
        setCreateError(err.message || 'Erro ao criar convite. Tente novamente.');
      }
    } finally {
      clearTimeout(timeout);
      setCreating(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('Deseja cancelar este convite?')) return;
    try {
      await apiCancelInvite(id);
      setSolicitacoes(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar convite.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setInviteToken('');
    setCopied(false);
    setCreateError('');
    setRequiredExams([]);
    setInviteData({
      collaboratorName: '',
      expectedCpf: '',
      expectedEmail: '',
      expectedBirthDate: '',
      roleFunction: '',
      roleFunctionCboCode: '',
      examType: 'admissional',
      expiresInDays: 7,
    });
  };

  const inviteLink = inviteToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${inviteToken}` : '';

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Solicitações</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PlusIcon style={{ width: 18, height: 18 }} />
          Nova Solicitação
        </button>
      </div>

      {/* Modal Nova Solicitação */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Novo Convite de Exame</h2>
              <button onClick={resetModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            {inviteToken ? (
              /* Sucesso — mostra link */
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <p style={{ color: '#166534', fontWeight: 600, marginBottom: '12px' }}>✅ Convite criado com sucesso!</p>
                  <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>Copie o link abaixo e envie ao colaborador:</p>
                  <code style={{ display: 'block', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '12px', wordBreak: 'break-all', color: '#1d4ed8' }}>
                    {inviteLink}
                  </code>
                </div>
                <button className="btn btn-primary" onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                  {copied ? <ClipboardDocumentCheckIcon style={{ width: 18 }} /> : <ClipboardDocumentIcon style={{ width: 18 }} />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
                <button onClick={resetModal} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
                  Fechar
                </button>
              </div>
            ) : (
              /* Formulário */
              <form onSubmit={handleCreateInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {createError && (
                  <div style={{ gridColumn: '1 / -1', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                    {createError}
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nome do Colaborador *</label>
                  <input required className="form-control" value={inviteData.collaboratorName}
                    onChange={e => setInviteData(p => ({ ...p, collaboratorName: e.target.value }))}
                    placeholder="Nome completo" />
                </div>

                <div className="form-group">
                  <label>CPF</label>
                  <input className="form-control" value={inviteData.expectedCpf}
                    onChange={e => setInviteData(p => ({ ...p, expectedCpf: e.target.value }))}
                    placeholder="000.000.000-00" />
                </div>

                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" className="form-control" value={inviteData.expectedEmail}
                    onChange={e => setInviteData(p => ({ ...p, expectedEmail: e.target.value }))}
                    placeholder="email@empresa.com" />
                </div>

                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input type="date" className="form-control" value={inviteData.expectedBirthDate}
                    onChange={e => setInviteData(p => ({ ...p, expectedBirthDate: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Validade (dias)</label>
                  <input type="number" min={1} max={30} className="form-control" value={inviteData.expiresInDays}
                    onChange={e => setInviteData(p => ({ ...p, expiresInDays: Number(e.target.value) }))} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Função / CBO *</label>
                  <CboAutocomplete
                    value={inviteData.roleFunctionCboCode}
                    onChange={val => setInviteData(p => ({ ...p, roleFunctionCboCode: val }))}
                    onSelect={handleCboSelect}
                    required
                  />
                </div>

                {requiredExams.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>Exames obrigatórios para este CBO:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {requiredExams.map(exam => (
                        <span key={exam} style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                          {exam.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Tipo de Exame *</label>
                  <select required className="form-control" value={inviteData.examType}
                    onChange={e => setInviteData(p => ({ ...p, examType: e.target.value }))}>
                    <option value="admissional">Admissional</option>
                    <option value="periodico">Periódico</option>
                    <option value="demissional">Demissional</option>
                    <option value="mudanca_funcao">Mudança de Função</option>
                    <option value="retorno">Retorno ao Trabalho</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Convite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabela de solicitações */}
      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : solicitacoes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhuma solicitação encontrada.</p>
        ) : (
          <>
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>CPF</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>ASO</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map(sol => (
                  <tr key={sol.id}>
                    <td style={{ fontWeight: 600 }}>{sol.patient?.name ?? '—'}</td>
                    <td>{sol.patient?.cpf ?? '—'}</td>
                    <td className="capitalize">{sol.examPurpose}</td>
                    <td>{new Date(sol.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge badge-done">{sol.status}</span></td>
                    <td>{sol.asoDocuments?.[0]?.decision ?? '—'}</td>
                    <td>
                      {sol.token ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 12px', fontSize: '13px', minHeight: 'unset', height: '32px' }}
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/p/${sol.token}`);
                              alert('Link copiado!');
                            }}
                          >
                            Copiar Link
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '4px 12px', fontSize: '13px', minHeight: 'unset', height: '32px', color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleCancelInvite(sol.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
