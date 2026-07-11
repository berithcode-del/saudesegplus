interface HorizontalBarData {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarChartProps {
  title: string;
  data: HorizontalBarData[];
  subtitle?: string;
}

export function HorizontalBarChart({ title, data, subtitle }: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {!data || data.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '24px 0',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Sem dados suficientes.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((item, i) => {
            const percentage = (item.value / maxValue) * 100;

            return (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: 4,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
