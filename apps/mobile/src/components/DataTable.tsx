interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon?: React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  title: string;
  columns: Column<T>[];
  data: T[];
  maxItems?: number;
  statusMap?: Record<string, StatusConfig>;
  onRowClick?: (item: T) => void;
  avatarColors?: string[];
  getAvatarInitial?: (item: T) => string;
  getAvatarName?: (item: T) => string;
  getAvatarSubtext?: (item: T) => string;
}

const DEFAULT_AVATAR_COLORS = [
  '#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
];

export function DataTable<T extends { id: string }>({
  title,
  columns,
  data,
  maxItems = 8,
  statusMap,
  onRowClick,
  avatarColors = DEFAULT_AVATAR_COLORS,
  getAvatarInitial,
  getAvatarName,
  getAvatarSubtext,
}: DataTableProps<T>) {
  const visibleData = data.slice(0, maxItems);

  if (visibleData.length === 0) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          {title}
        </div>
        <div
          style={{
            textAlign: 'center',
          padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          Nenhum registro encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleData.map((item, index) => {
          const initial = getAvatarInitial?.(item) ?? '?';
          const name = getAvatarName?.(item) ?? '';
          const subtext = getAvatarSubtext?.(item);
          const avatarBg = avatarColors[index % avatarColors.length];
          const statusKey = (item as Record<string, unknown>).status as string | undefined;
          const status = statusKey && statusMap ? statusMap[statusKey] : undefined;

          const visibleColumns = columns.filter((col) => !col.hideOnMobile);

          return (
            <div
              key={item.id}
              className={onRowClick ? 'card-hover' : undefined}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              style={{
                padding: 16,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 16,
                cursor: onRowClick ? 'pointer' : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {initial}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {name}
                    </span>
                    {status && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: status.bgColor,
                          color: status.color,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    )}
                  </div>

                  {subtext && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {subtext}
                    </div>
                  )}

                  {visibleColumns.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px 12px',
                        marginTop: 8,
                      }}
                    >
                      {visibleColumns.map((col) => (
                        <div
                          key={col.key}
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {col.label}:{' '}
                          </span>
                          {col.render
                            ? col.render(item, index)
                            : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {onRowClick && (
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0, color: 'var(--text-muted)' }}
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
