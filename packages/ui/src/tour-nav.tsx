import React from 'react';

export interface TourNavProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  onClose: () => void;
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 16,
  gap: 10,
};

function buttonBase(disabled: boolean, primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    opacity: disabled ? 0.45 : 1,
    backgroundColor: primary ? '#4f46e5' : 'transparent',
    color: primary ? '#fff' : '#6b7280',
    transition: 'opacity 0.15s ease, background-color 0.15s ease',
  };
}

export function TourNav({ onPrev, onNext, isFirst, isLast, onClose }: TourNavProps) {
  return (
    <div style={footerStyle}>
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        style={buttonBase(isFirst, false)}
        aria-label="Voltar"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M12.5 4.5L7 10l5.5 5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Voltar
      </button>

      <button
        type="button"
        onClick={isLast ? onClose : onNext}
        style={buttonBase(false, true)}
        aria-label={isLast ? 'Concluir' : 'Avançar'}
      >
        {isLast ? 'Concluir' : 'Avançar'}
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M7.5 4.5L13 10l-5.5 5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
