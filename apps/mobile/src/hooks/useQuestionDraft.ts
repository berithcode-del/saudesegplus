import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionDraft, EMPTY_DRAFT, saveDraft, loadDraft, clearDraft } from '../lib/questionDraft';

const DEBOUNCE_MS = 300;

export function useQuestionDraft(token: string) {
  const [draft, setDraft] = useState<QuestionDraft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    loadDraft(token).then(d => {
      if (active && d) {
        setDraft(d);
      }
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [token]);

  const update = useCallback(
    (patch: Partial<QuestionDraft>) => {
      setDraft(prev => {
        const next = { ...prev, ...patch };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveDraft(token, next);
        }, DEBOUNCE_MS);
        return next;
      });
    },
    [token],
  );

  const clear = useCallback(() => {
    clearDraft(token);
    setDraft(EMPTY_DRAFT);
  }, [token]);

  return { draft, update, loaded, clear };
}
