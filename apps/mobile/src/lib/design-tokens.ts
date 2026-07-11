/**
 * Design Tokens — SaudeSeg+ Mobile
 * Copiado EXATAMENTE do apps/web/app/globals.css
 * NÃO alterar valores — sincronizar com web sempre.
 */

export const tokens = {
  colors: {
    // Backgrounds
    bgApp: '#f8fafc',
    bgCard: '#ffffff',
    bgCardHover: '#f8f8ff',
    bgInput: '#f4f5fb',
    bgSidebar: '#4f46e5',
    bgSidebarHover: 'rgba(255, 255, 255, 0.15)',
    bgSidebarActive: 'rgba(255, 255, 255, 0.22)',

    // Accent
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    secondary: '#f59e0b',
    teal: '#0ea5e9',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',

    // Text
    textPrimary: '#1e1b4b',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    textOnPrimary: '#ffffff',
    textSidebar: 'rgba(255,255,255,0.75)',
    textSidebarActive: '#ffffff',

    // Borders
    borderLight: '#e5e7eb',
    borderSubtle: 'rgba(79, 70, 229, 0.1)',
  },

  shadows: {
    card: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
    cardHover: '0 8px 28px rgba(79, 70, 229, 0.14)',
    sidebar: '4px 0 24px rgba(79, 70, 229, 0.2)',
    btn: '0 4px 14px rgba(79, 70, 229, 0.35)',
    btnHover: '0 6px 20px rgba(79, 70, 229, 0.45)',
  },

  radii: {
    card: '20px',
    button: '12px',
    input: '12px',
    navItem: '14px',
    modal: '20px',
    badge: '20px',
    avatar: '50%',
    pill: '999px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h2: { fontSize: '24px', fontWeight: '700', letterSpacing: '-0.3px' },
    h3: { fontSize: '16px', fontWeight: '600' },
    body: { fontSize: '14px', fontWeight: '400' },
    label: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    badge: { fontSize: '11px', fontWeight: '600' },
    statValue: { fontSize: '30px', fontWeight: '800' },
    statLabel: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.4px', textTransform: 'uppercase' as const },
  },
} as const;
