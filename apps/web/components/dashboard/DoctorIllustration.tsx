'use client';

/**
 * DoctorIllustration — ilustração original (não é cópia de asset de terceiros)
 * inspirada na composição do kit de referência: médica de jaleco, cabelo
 * ruivo, xícara, prancheta, folhas atrás, pílulas flutuando.
 * Usa só os tokens de cor do design system (var(--accent-*)).
 */
export default function DoctorIllustration() {
  return (
    <svg viewBox="0 0 320 240" style={{ width: '100%', height: '100%', maxWidth: '300px' }}>
      {/* folhas decorativas atrás, formato de pétala oval */}
      <ellipse cx="62" cy="150" rx="34" ry="85" fill="var(--accent-primary)" opacity="0.85" transform="rotate(-12 62 150)" />
      <ellipse cx="258" cy="150" rx="30" ry="78" fill="var(--accent-primary)" opacity="0.55" transform="rotate(12 258 150)" />
      <ellipse cx="100" cy="160" rx="20" ry="60" fill="#a5a0f7" opacity="0.55" transform="rotate(-6 100 160)" />

      {/* corpo / jaleco */}
      <path
        d="M115 235 L115 165 C115 135, 135 118, 160 118 C185 118, 205 135, 205 165 L205 235 Z"
        fill="var(--accent-primary)"
      />
      {/* abertura do jaleco */}
      <path d="M152 132 L160 233 L168 132" fill="#3730a3" opacity="0.4" />

      {/* braço esquerdo com prancheta */}
      <path d="M118 168 C100 174, 90 190, 94 212" stroke="var(--accent-primary)" strokeWidth="22" strokeLinecap="round" fill="none" />
      <rect x="76" y="196" width="34" height="46" rx="4" fill="#ffffff" stroke="#d1d5db" />
      <rect x="83" y="205" width="20" height="3" fill="var(--accent-secondary)" />
      <rect x="83" y="213" width="20" height="3" fill="#e5e7eb" />
      <rect x="83" y="221" width="13" height="3" fill="#e5e7eb" />

      {/* braço direito com xícara */}
      <path d="M202 168 C220 176, 228 192, 222 210" stroke="var(--accent-primary)" strokeWidth="22" strokeLinecap="round" fill="none" />
      <path d="M208 206 h26 v16 a13 13 0 0 1 -26 0 z" fill="#ffffff" stroke="#d1d5db" />
      <path d="M234 210 q11 1 9 12 q-2 9 -11 7" fill="none" stroke="#d1d5db" strokeWidth="2" />

      {/* pescoço */}
      <rect x="148" y="80" width="24" height="24" rx="10" fill="#f3b88a" />

      {/* cabelo (atrás da cabeça) */}
      <path
        d="M126 58 C122 26, 145 12, 160 12 C176 12, 199 26, 195 58 C194 70, 188 80, 188 80 L132 80 C132 80, 127 70, 126 58 Z"
        fill="#e85d3f"
      />

      {/* cabeça */}
      <circle cx="160" cy="58" r="29" fill="#f7c4a0" />

      {/* franja / mechas laterais por cima do rosto */}
      <path d="M131 50 C128 65, 132 82, 142 90 C136 75, 134 60, 137 48 Z" fill="#e85d3f" />
      <path d="M189 50 C192 65, 188 82, 178 90 C184 75, 186 60, 183 48 Z" fill="#e85d3f" />

      {/* rosto */}
      <circle cx="150" cy="60" r="2.4" fill="#3730a3" />
      <circle cx="170" cy="60" r="2.4" fill="#3730a3" />
      <path d="M150 70 Q160 76 170 70" stroke="#c2785a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="142" cy="65" r="4" fill="#f0a07c" opacity="0.5" />
      <circle cx="178" cy="65" r="4" fill="#f0a07c" opacity="0.5" />

      {/* estetoscópio */}
      <path d="M142 122 C142 138, 150 146, 160 146 C170 146, 178 138, 178 122" stroke="#374151" strokeWidth="3" fill="none" />
      <circle cx="160" cy="148" r="5" fill="#374151" />

      {/* pílulas flutuando */}
      <g transform="rotate(25 70 45)">
        <rect x="58" y="38" width="22" height="11" rx="5.5" fill="var(--accent-secondary)" />
        <rect x="58" y="38" width="11" height="11" rx="5.5" fill="#fde68a" />
      </g>
      <g transform="rotate(-15 252 42)">
        <rect x="242" y="36" width="20" height="10" rx="5" fill="var(--accent-teal)" />
        <rect x="242" y="36" width="10" height="10" rx="5" fill="#bae6fd" />
      </g>
      <circle cx="222" cy="26" r="4" fill="var(--accent-secondary)" opacity="0.7" />
      <circle cx="88" cy="26" r="3" fill="var(--accent-teal)" opacity="0.7" />
    </svg>
  );
}
