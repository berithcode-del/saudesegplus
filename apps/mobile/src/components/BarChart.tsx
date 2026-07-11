interface BarData {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  data: BarData[];
  primaryColor?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
  subtitle?: string;
}

export function BarChart({
  title,
  data,
  primaryColor = '#4f46e5',
  secondaryColor = '#c7d2fe',
  primaryLabel,
  secondaryLabel,
  height = 160,
  subtitle,
}: BarChartProps) {
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

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height,
        }}
      >
        {data.map((item, i) => {
          const barHeight = Math.max((item.value / maxValue) * (height - 24), item.value > 0 ? 8 : 0);

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {item.value}
              </span>
              <div
                style={{
                  width: '100%',
                  height: barHeight,
                  borderRadius: 6,
                  background: i === 0 ? primaryColor : secondaryColor,
                  transition: 'height 0.3s ease',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {(primaryLabel || secondaryLabel) && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {primaryLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: primaryColor,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {primaryLabel}
              </span>
            </div>
          )}
          {secondaryLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: secondaryColor,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {secondaryLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
