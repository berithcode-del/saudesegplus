'use client';
import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { apiListSolicitacoes, apiFetch, apiGetRequiredExams } from '../../lib/api';
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
  const [requiredExams, setRequiredExams] = useState<string[]>([]);

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
