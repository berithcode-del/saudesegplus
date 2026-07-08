import React, { useEffect, useRef, useState } from 'react';
import type { TourStep } from './tour-types';
import { TourStepDots } from './tour-step-dots';
import { TourNav } from './tour-nav';

export interface TourPopoverProps {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

const CARD_MARGIN = 12;
const CARD_MAX_WIDTH = 480; // Aumentado para suportar tutoriais maiores
const CARD_ESTIMATED_HEIGHT = 200;

function getRect(selector?: string): Rect | null {
  if (typeof document === 'undefined' || !selector) return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    left: r.left,
    bottom: r.bottom,
    right: r.right,
    width: r.width,
    height: r.height,
  };
}

function computeCardPosition(rect: Rect | null, posicao: TourStep['posicao']) {
  if (!rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    } as React.CSSProperties;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(CARD_MAX_WIDTH, vw - CARD_MARGIN * 2);
  const cardH = CARD_ESTIMATED_HEIGHT;

  let top = CARD_MARGIN;
  let left = CARD_MARGIN;

  switch (posicao) {
    case 'bottom':
      top = rect.bottom + CARD_MARGIN;
      left = rect.left;
      break;
    case 'top':
      top = rect.top - CARD_MARGIN - cardH;
      left = rect.left;
      break;
    case 'right':
      top = rect.top;
      left = rect.right + CARD_MARGIN;
      break;
    case 'left':
      top = rect.top;
      left = rect.left - CARD_MARGIN - cardW;
      break;
  }

  top = Math.max(CARD_MARGIN, Math.min(top, vh - cardH - CARD_MARGIN));
  left = Math.max(CARD_MARGIN, Math.min(left, vw - cardW - CARD_MARGIN));

  return { top, left, width: cardW } as React.CSSProperties;
}

export function TourPopover({
  step,
  index,
  total,
  onNext,
  onPrev,
  onClose,
}: TourPopoverProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setRect(getRect(step.anchorSelector));
    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step.anchorSelector, index]);

  useEffect(() => {
    const card = cardRef.current;
    if (card) card.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && card) {
        const focusables = card.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          card.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (first && e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (last && !e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, index]);

  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '20px 22px',
    maxWidth: CARD_MAX_WIDTH,
    boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
    color: '#1e1b4b',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    ...computeCardPosition(rect, step.posicao),
  };

  const spotlightStyle: React.CSSProperties | null = rect
    ? {
        position: 'fixed',
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        borderRadius: 8,
        boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
        zIndex: 9998,
        pointerEvents: 'none',
      }
    : null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: rect ? 'transparent' : 'rgba(15,23,42,0.6)', // Fundo escuro quando for Modal Central
    zIndex: 9998,
    transition: 'background-color 0.3s ease',
  };

  const closeBtn: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 4,
    lineHeight: 0,
  };

  return (
    <>
      <div
        style={overlayStyle}
        onClick={onClose}
        aria-hidden="true"
      />
      {spotlightStyle && <div style={spotlightStyle} aria-hidden="true" />}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={step.titulo}
        tabIndex={-1}
        style={cardStyle}
      >
        <button type="button" style={closeBtn} onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        <div style={{ fontWeight: 800, fontSize: rect ? 16 : 22, marginBottom: 8, paddingRight: 24, letterSpacing: '-0.3px' }}>
          {step.titulo}
        </div>

        {step.image && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
            <img src={step.image} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}

        <div
          aria-live="polite"
          style={{ fontSize: rect ? 13 : 15, color: '#4b5563', lineHeight: 1.6, marginBottom: 16 }}
        >
          {step.texto}
        </div>

        <TourStepDots total={total} current={index} />
        <TourNav
          onPrev={onPrev}
          onNext={onNext}
          isFirst={index === 0}
          isLast={index === total - 1}
          onClose={onClose}
        />
      </div>
    </>
  );
}
