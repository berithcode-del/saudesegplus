'use client';
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FaqItem {
  pergunta: string;
  resposta: string;
}

const faqData: Record<string, FaqItem[]> = {
  EMPRESA: [
    {
      pergunta: 'Como convido um novo colaborador?',
      resposta: 'Acesse Solicitações de Exame e clique em "Novo Convite". Preencha os dados do colaborador e escolha o tipo de exame. Um link será enviado por e-mail.',
    },
    {
      pergunta: 'Por que meu convite está "Aguardando o colaborador"?',
      resposta: 'O colaborador ainda não abriu o link de convite enviado por e-mail. Após ele acessar e preencher o cadastro, o status muda automaticamente.',
    },
    {
      pergunta: 'Como acompanho os exames dos meus colaboradores?',
      resposta: 'Na página Solicitações de Exame você vê o status de cada solicitação em tempo real: Aguardando Coleta, Na Fila Médica, Em Atendimento ou Concluído.',
    },
    {
      pergunta: 'Onde subo os documentos da empresa (PCMSO/PPRA)?',
      resposta: 'Em Configurações → Documentos da Empresa. Envie o PDF e o sistema validará automaticamente a data de validade.',
    },
    {
      pergunta: 'Meus documentos estão válidos?',
      resposta: 'No painel da empresa, o checklist exibe o status de cada documento: ✅ válido, ⚠️ vencido ou ❌ ausente. Documentos vencidos bloqueiam novos convites.',
    },
  ],
  CLINICA: [
    {
      pergunta: 'Como registro a chegada de um paciente?',
      resposta: 'Na página inicial da clínica, localize o paciente na fila de espera e clique em "Confirmar Chegada" para iniciar o fluxo de atendimento.',
    },
    {
      pergunta: 'O que cada status da solicitação significa?',
      resposta: 'AGUARDANDO COLETA = paciente chegou mas exames pendentes. NA FILA MÉDICA = aguardando médico. EM ATENDIMENTO MÉDICO = em teleconsulta. CONCLUÍDO = ASO emitido.',
    },
    {
      pergunta: 'Onde vejo os repasses financeiros?',
      resposta: 'A aba Financeiro exibe os repasses pendentes e realizados para a clínica, com detalhamento por período.',
    },
  ],
  MEDICO: [
    {
      pergunta: 'Como inicio uma teleconsulta?',
      resposta: 'Na Fila de Atendimento, selecione o paciente e clique em "Iniciar Consulta". O paciente será notificado automaticamente.',
    },
    {
      pergunta: 'Onde registro o ASO?',
      resposta: 'Durante a consulta, use a aba Documentos para emitir e assinar digitalmente o Atestado de Saúde Ocupacional.',
    },
    {
      pergunta: 'Por que um paciente está "Aguardando exames"?',
      resposta: 'O paciente precisa realizar exames complementares (audiometria, espirometria, etc.) antes da consulta médica. Os exames obrigatórios são definidos pelo CBO da função.',
    },
    {
      pergunta: 'Como altero minha disponibilidade?',
      resposta: 'Em Configurações → Agenda, defina os horários em que está disponível para atendimento. A fila respeita sua disponibilidade.',
    },
  ],
};

export default function FaqHelp({ perfil }: { perfil: keyof typeof faqData }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = faqData[perfil] ?? [];

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>
        Central de Dúvidas
      </h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Tire suas dúvidas sobre o funcionamento da plataforma.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 14, fontWeight: 600, color: '#1e1b4b',
              }}
            >
              {item.pergunta}
              <ChevronDownIcon
                style={{
                  width: 16, height: 16,
                  transform: openIdx === i ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s',
                }}
              />
            </button>
            {openIdx === i && (
              <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                {item.resposta}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
