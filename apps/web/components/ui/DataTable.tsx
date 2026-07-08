'use client';
import React from 'react';

/**
 * DataTable — tabela genérica padrão para qualquer dashboard (empresa,
 * médico, clínica). Usa a classe .queue-table já definida em
 * app/globals.css (paleta de tokens UiMed). Define colunas e como
 * renderizar cada célula; não embute regra de negócio específica de tela.
 */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
}: DataTableProps<T>) {
  if (loading) {
    return <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Carregando...</p>;
  }

  if (rows.length === 0) {
    return <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>{emptyMessage}</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="queue-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
