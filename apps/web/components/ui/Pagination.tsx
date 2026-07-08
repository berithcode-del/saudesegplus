'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {total} resultado{total !== 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ← Anterior
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {page} / {totalPages}
        </span>
        <button
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
