'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { PaymentQuote } from '../../app/lib/api';

interface PaymentReviewCardProps {
  title?: string;
  subjectName: string;
  examPurpose: string;
  quote: PaymentQuote;
  loading?: boolean;
  onBack?: () => void;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

const formatExamPurpose = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function PaymentReviewCard({
  title = 'Revisar informações e pagamento',
  subjectName,
  examPurpose,
  quote,
  loading = false,
  onBack,
  onConfirm,
  confirmLabel = 'Confirmar pagamento e continuar',
}: PaymentReviewCardProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div
        style={{
          border: '1px solid var(--border-light, #e5e7eb)',
          borderRadius: '12px',
          padding: '18px',
          background: 'var(--card-bg, #fff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              background: 'rgba(59,111,245,0.1)',
              color: '#3b6ff5',
            }}
          >
            <CreditCardIcon style={{ width: 20, height: 20 }} />
          </span>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Pagamento simulado para validar o fluxo antes da integração Asaas.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pessoa</span>
            <strong style={{ textAlign: 'right' }}>{subjectName || 'Nao informado'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tipo de ASO</span>
            <strong style={{ textAlign: 'right' }}>{formatExamPurpose(examPurpose || 'ASO')}</strong>
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {quote.items.map((item) => (
            <div
              key={item.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                borderBottom: '1px solid rgba(15,23,42,0.06)',
                fontSize: '14px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <DocumentTextIcon style={{ width: 17, height: 17, color: '#667085' }} />
                {item.name}
              </span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px',
              background: 'rgba(59,111,245,0.06)',
              fontSize: '15px',
            }}
          >
            <strong>Total a pagar</strong>
            <strong>{formatCurrency(quote.total)}</strong>
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.18)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: 1.45,
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            style={{ marginTop: '2px' }}
          />
          Confirmo a revisão dos dados e autorizo registrar este pagamento como simulado nesta etapa.
        </label>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack} disabled={loading}>
            Voltar
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={!accepted || loading}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {loading ? (
            'Processando...'
          ) : (
            <>
              <CheckCircleIcon className="icon icon-sm" />
              {confirmLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
