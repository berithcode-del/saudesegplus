import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TourStep, Tutorial } from './tour-types';
import { TourPopover } from './tour-popover';

interface TourContextValue {
  isOpen: boolean;
  index: number;
  tutorial: Tutorial | null;
  open: (stepIndex?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  finish: (skipped: boolean) => void;
}

const Ctx = createContext<TourContextValue | null>(null);

export interface TourProviderProps {
  tutorial: Tutorial | null;
  onComplete?: (skipped: boolean) => void;
  children: React.ReactNode;
}

export function TourProvider({ tutorial, onComplete, children }: TourProviderProps) {
  const [isOpen, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const open = useCallback((stepIndex = 0) => {
    setIndex(stepIndex);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const finish = useCallback(
    (skipped: boolean) => {
      setOpen(false);
      onComplete?.(skipped);
    },
    [onComplete]
  );

  const next = useCallback(() => {
    const steps: TourStep[] = tutorial?.steps ?? [];
    if (index < steps.length - 1) {
      setIndex(index + 1);
    } else {
      finish(false);
    }
  }, [tutorial, index, finish]);

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({ isOpen, index, tutorial, open, close, next, prev, finish }),
    [isOpen, index, tutorial, open, close, next, prev, finish]
  );

  const currentStep = tutorial?.steps[index];

  return (
    <Ctx.Provider value={value}>
      {children}
      {isOpen && currentStep && (
        <TourPopover
          step={currentStep}
          index={index}
          total={tutorial!.steps.length}
          onNext={next}
          onPrev={prev}
          onClose={() => finish(true)}
        />
      )}
    </Ctx.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useTour deve ser usado dentro de um <TourProvider>');
  }
  return ctx;
}
