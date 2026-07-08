'use client';

interface Invite {
  examType: string;
}

interface InvitesChartProps {
  invites?: Invite[];
}

export default function InvitesChart({ invites = [] }: InvitesChartProps) {
  // Contabilizar tipos de exame
  const counts: Record<string, number> = {
    admissional: 0,
    periodico: 0,
    demissional: 0,
    outros: 0,
  };

  invites.forEach((i) => {
    const type = i.examType;
    if (type === 'admissional' || type === 'periodico' || type === 'demissional') {
      counts[type] = (counts[type] || 0) + 1;
    } else {
      counts['outros'] = (counts['outros'] || 0) + 1;
    }
  });

  const data = [
    { label: 'Admissional', value: counts.admissional, color: '#3b82f6' },
    { label: 'Periódico', value: counts.periodico, color: '#22c55e' },
    { label: 'Demissional', value: counts.demissional, color: '#f59e0b' },
    { label: 'Outros', value: counts.outros, color: '#8b5cf6' },
  ].filter(d => (d.value ?? 0) > 0);

  const total = data.reduce((acc, curr) => acc + (curr.value ?? 0), 0);

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
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b', marginBottom: '20px' }}>
        Exames Mais Solicitados
      </h3>

      {total === 0 ? (
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>
          Sem dados suficientes.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((item, idx) => {
            const percentage = Math.round(((item.value ?? 0) / (total || 1)) * 100);
            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{percentage}%</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: item.color,
                      width: `${percentage}%`,
                      borderRadius: '4px',
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
