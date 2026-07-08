'use client';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Solicitacao {
  createdAt: string;
}

interface DailyFlowChartProps {
  solicitacoes?: Solicitacao[];
}

export default function DailyFlowChart({ solicitacoes = [] }: DailyFlowChartProps) {
  // Inicializar fluxo
  const dayTotals = Array.from({ length: 6 }, (_, i) => ({
    day: DAYS[i],
    total: 0,
  }));

  // O ideal no futuro é trazer o count do backend real da semana, 
  // mas aqui agrupamos pelo que veio na request.
  solicitacoes.forEach(sol => {
    const d = new Date(sol.createdAt);
    const dow = d.getDay() - 1; // 0=Seg, 5=Sáb, -1=Dom
    if (dow >= 0 && dow < 6) {
      const entry = dayTotals[dow];
      if (entry) entry.total++;
    }
  });

  const maxTotal = Math.max(...dayTotals.map(d => d.total), 1);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b' }}>
          Fluxo de Pacientes
        </h3>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#f8fafc',
            fontSize: '12px',
            color: '#6b7280',
            cursor: 'pointer',
          }}
        >
          Esta semana
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '120px',
          gap: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        {dayTotals.map((data, idx) => {
          const height = (data.total / maxTotal) * 100;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flex: 1,
                height: '100%',
              }}
              title={`Total: ${data.total}`}
            >
              <div
                style={{
                  width: '100%',
                  height: `${height}%`,
                  background: 'linear-gradient(180deg, #0d9488 0%, #14b8a6 100%)',
                  borderRadius: '6px 6px 0 0',
                  minHeight: data.total > 0 ? '8px' : '0px',
                  transition: 'height 0.4s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
        }}
      >
        {dayTotals.map(({ day }, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '11px',
              color: '#9ca3af',
              fontWeight: 500,
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
