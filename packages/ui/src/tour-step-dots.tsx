import React from 'react';

export interface TourStepDotsProps {
  total: number;
  current: number;
}

export function TourStepDots({ total, current }: TourStepDotsProps) {
  const container: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 14,
  };

  return (
    <div style={container} aria-hidden={true}>
      {Array.from({ length: total }).map((_, i) => {
        const dot: React.CSSProperties = {
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: i === current ? '#4f46e5' : '#d1d5db',
          transition: 'background-color 0.2s ease',
        };
        return <span key={i} style={dot} />;
      })}
    </div>
  );
}
