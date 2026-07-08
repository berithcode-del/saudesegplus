'use client';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface PatientsChartProps {
  solicitacoes?: any[];
}

export default function PatientsChart({ solicitacoes = [] }: PatientsChartProps) {
  // Inicializar dados para cada dia da semana (Segunda a Domingo, índices 1 a 0 no JS)
  // Mas vamos mapear para 0 a 6 onde 0 é Segunda
  const dayTotals = Array.from({ length: 7 }, (_, i) => ({
    day: DAYS[i],
    novos: 0,
    retorno: 0,
  }));

  // Popula os totais baseados nos agendamentos da semana
  solicitacoes.forEach(sol => {
    const d = new Date(sol.createdAt);
    let dow = d.getDay() - 1;
    if (dow === -1) dow = 6; // Domingo

    const entry = dayTotals[dow];
    if (!entry) return;

    if (sol.examPurpose === 'admissional') {
      entry.novos++;
    } else {
      entry.retorno++;
    }
  });

  // Encontrar o valor máximo para proporção do gráfico
  const maxTotal = Math.max(...dayTotals.map(d => Math.max(d.novos, d.retorno)), 1); // Evitar divisão por 0

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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b' }}>
          Número de Pacientes
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
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        {dayTotals.map((data, idx) => {
          // Ajusta a altura da barra baseado no máximo para o gráfico ficar bonito
          // Multiplica por 100 e divide por maxTotal, mas limita a 100%
          const primaryHeight = (data.novos / maxTotal) * 100;
          const secondaryHeight = (data.retorno / maxTotal) * 100;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px',
                flex: 1,
              }}
              title={`Seg: ${data.novos} Novos, ${data.retorno} Retornos`}
            >
              {/* Barra Azul (pacientes novos) */}
              <div
                style={{
                  flex: 1,
                  height: `${primaryHeight}%`,
                  background: '#4f46e5',
                  borderRadius: '6px 6px 0 0',
                  minHeight: data.novos > 0 ? '8px' : '0px',
                  transition: 'height 0.3s ease',
                }}
              />
              {/* Barra Laranja (secundário/retorno) */}
              <div
                style={{
                  flex: 1,
                  height: `${secondaryHeight}%`,
                  background: '#f59e0b',
                  borderRadius: '6px 6px 0 0',
                  minHeight: data.retorno > 0 ? '8px' : '0px',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels dos dias */}
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

      {/* Legenda */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '2px', background: '#4f46e5' }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Novos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '2px', background: '#f59e0b' }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Retorno</span>
        </div>
      </div>
    </div>
  );
}
