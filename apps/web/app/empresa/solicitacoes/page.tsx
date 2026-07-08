'use client';
import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { apiListSolicitacoes } from '../../lib/api';
import { Pagination } from '../../../components/ui/Pagination';
import { PlusIcon, ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import CboAutocomplete from '../../../components/ui/CboAutocomplete';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

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

  useEffect(() => {
    const fetchCompanyId = async () => {
      const token = localStorage.getItem('token');
      let cid = localStorage.getItem('companyId');
      
      if (!cid && token) {
        try {
          const parts = token.split('.');
          const payload = JSON.parse(atob(parts[1] ?? ''));
          cid = payload?.profileId || payload?.companyId;
        } catch (err) {
          console.error('Erro ao decodificar token:', err);
        }
      }
      
      if (!cid) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/company`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await res.json();
          if (result.data && result.data.length > 0) {
            cid = result.data[0].id;
            localStorage.setItem('companyId', cid as string);
          }
        } catch (err) {
          console.error('Erro ao buscar company ID', err);
        }
      }
      
      if (cid) setCompanyId(cid);
    };
    fetchCompanyId();
  }, []);

  const fetchData = async (p: number) => {
    setLoading(true);
    try {
      const r = await apiListSolicitacoes({ companyId }, p, 20);
      let requests = Array.isArray(r.data) ? r.data : [];

      if (p === 1) {
        try {
          const invRes = await fetch(`${BACKEND_URL}/api/company/${companyId}/invites`);
          const invData = await invRes.json();
          if (invData.success && Array.isArray(invData.data)) {
            const pendingInvites = invData.data
              .filter((i: any) => ['ENVIADO', 'PENDENTE', 'ABERTO'].includes(i.status))
              .filter((i: any) => !requests.some((req: any) => req.invite?.id === i.id || req.inviteId === i.id))
              .map((i: any) => ({
                id: i.id,
                examPurpose: i.examType,
                status: 'CONVITE ' + i.status,
                createdAt: i.createdAt,
                patient: { name: i.collaboratorName || i.expectedEmail || i.expectedCpf || 'Novo Colaborador', cpf: i.expectedCpf || '—' },
                asoDocuments: [{ decision: 'Aguardando aceite' }],
                token: i.token,
              }));
            requests = [...pendingInvites, ...requests];
          }
        } catch (e) {
          console.error('Erro ao buscar convites', e);
        }
      }

      setSolicitacoes(requests);
      if (r.pagination) {
        setTotalPages(r.pagination.totalPages);
        setTotal(r.pagination.total);
      }
    } catch { setSolicitacoes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (companyId) fetchData(page);
  }, [companyId, page]);

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Deseja realmente excluir este convite?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/company/invite/${inviteId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData(page);
      } else {
        alert('Erro ao excluir convite.');
      }
    } catch (e) {
      alert('Erro de conexão ao excluir convite.');
    }
  };

  const handleExportCsv = async () => {
    const params = new URLSearchParams({ formato: 'csv' });
    const token = localStorage.getItem('accessToken');
    const url = `${BACKEND_URL}/api/company/${companyId}/relatorio?${params.toString()}`;
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { alert('Erro ao gerar relatório.'); return; }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { alert('Erro ao exportar CSV.'); }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/company/${companyId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        setInviteToken(data.data.token);
        fetchData(1); // Atualiza lista
      } else {
        alert(data.message || 'Erro ao criar convite');
      }
    } catch {
      alert('Erro de conexão ao criar convite');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/p/${inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Solicitações</h2>
            <p>Todas as solicitações de exame da empresa</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleExportCsv}>
              <ArrowDownTrayIcon className="icon" /> Exportar CSV
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="icon" /> Nova Solicitação
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setInviteToken(''); }}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{inviteToken ? 'Convite Criado com Sucesso' : 'Nova Solicitação de Exame'}</h3>
              <button className="close-btn" onClick={() => { setIsModalOpen(false); setInviteToken(''); }}>&times;</button>
            </div>
            <div className="modal-body">
              {inviteToken ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ marginBottom: '16px', color: '#4b5563' }}>Envie este link para o colaborador iniciar o processo:</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
                    <input 
                      readOnly 
                      value={`${window.location.origin}/p/${inviteToken}`} 
                      className="form-input" 
                      style={{ marginBottom: 0, flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={copyLink}>
                      {copied ? <ClipboardDocumentCheckIcon className="icon" /> : <ClipboardDocumentIcon className="icon" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite} className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nome do Colaborador</label>
                    <input className="form-input" required value={inviteData.collaboratorName} onChange={e => setInviteData({...inviteData, collaboratorName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input className="form-input" required value={inviteData.expectedCpf} onChange={e => setInviteData({...inviteData, expectedCpf: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input type="email" className="form-input" required value={inviteData.expectedEmail} onChange={e => setInviteData({...inviteData, expectedEmail: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input type="date" className="form-input" required value={inviteData.expectedBirthDate} onChange={e => setInviteData({...inviteData, expectedBirthDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Função (CBO)</label>
                    <CboAutocomplete
                      value={inviteData.roleFunction}
                      onChange={(v) => setInviteData({...inviteData, roleFunction: v})}
                      onSelect={(cboCode) => setInviteData({...inviteData, roleFunctionCboCode: cboCode})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de Exame</label>
                    <select className="form-input" required value={inviteData.examType} onChange={e => setInviteData({...inviteData, examType: e.target.value})}>
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
        </div>
      )}

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
                    <td style={{ fontWeight: 600 }}>{sol.patient.name}</td>
                    <td>{sol.patient.cpf}</td>
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
