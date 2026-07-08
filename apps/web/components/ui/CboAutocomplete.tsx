'use client';
import { useState, useEffect, useRef } from 'react';
import { apiSearchCbo } from '../../app/lib/api';

interface CboOption {
  cboCode: string;
  functionName: string;
}

interface CboAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (cboCode: string, functionName: string) => void;
  required?: boolean;
}

export default function CboAutocomplete({ value, onChange, onSelect, required }: CboAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CboOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await apiSearchCbo(query);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        required={required}
        value={selectedLabel || query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setSelectedLabel('');
        }}
        placeholder="Digite a função..."
        autoComplete="off"
      />
      {loading && (
        <span style={{ position: 'absolute', right: 8, top: 8, fontSize: 12, color: '#9ca3af' }}>
          buscando...
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0,
            background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
            marginTop: 2, padding: 4, maxHeight: 240, overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {suggestions.map((item) => (
            <li
              key={item.cboCode}
              onClick={() => {
                setSelectedLabel(`${item.functionName} (${item.cboCode})`);
                setQuery(item.functionName);
                onChange(item.functionName);
                onSelect?.(item.cboCode, item.functionName);
                setOpen(false);
              }}
              style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: 4,
                fontSize: 14, display: 'flex', justifyContent: 'space-between',
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{item.functionName}</span>
              <span style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>{item.cboCode}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
