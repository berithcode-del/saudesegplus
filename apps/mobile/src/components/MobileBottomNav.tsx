import { NavLink } from 'react-router-dom';

type IconName =
  | 'chart'
  | 'heart'
  | 'clock'
  | 'cog'
  | 'building'
  | 'users'
  | 'plus'
  | 'dollar'
  | 'grid'
  | 'clipboard'
  | 'document-check'
  | 'folder'
  | 'store'
  | 'chat';

export interface MobileBottomNavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number;
}

interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegacao principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }: { isActive: boolean }) => `mobile-bottom-item${isActive ? ' active' : ''}`}
        >
          <span className="mobile-bottom-icon">
            <NavIcon name={item.icon} />
            {!!item.badge && item.badge > 0 && <span className="mobile-bottom-badge">{item.badge}</span>}
          </span>
          <span className="mobile-bottom-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'chart' && (
        <>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-5" />
          <path d="M12 16V8" />
          <path d="M16 16v-3" />
        </>
      )}
      {name === 'heart' && (
        <path d="M20.8 4.6a5.2 5.2 0 0 0-7.4 0L12 6l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21l8.8-9a5.2 5.2 0 0 0 0-7.4Z" />
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === 'cog' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-3h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v3h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </>
      )}
      {name === 'building' && (
        <>
          <path d="M4 21h16" />
          <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
          <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
        </>
      )}
      {name === 'users' && (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
          <path d="M16 3.2a4 4 0 0 1 0 7.6" />
        </>
      )}
      {name === 'plus' && (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      )}
      {name === 'dollar' && (
        <>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      )}
      {name === 'grid' && (
        <>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </>
      )}
      {name === 'clipboard' && (
        <>
          <path d="M9 4h6l1 2h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l1-2Z" />
          <path d="M9 12h6M9 16h4" />
        </>
      )}
      {name === 'document-check' && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="m8 15 2 2 5-5" />
        </>
      )}
      {name === 'folder' && (
        <>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </>
      )}
      {name === 'store' && (
        <>
          <path d="M4 10h16l-1-5H5l-1 5Z" />
          <path d="M6 10v10h12V10" />
          <path d="M9 20v-6h6v6" />
        </>
      )}
      {name === 'chat' && (
        <>
          <path d="M21 12a7 7 0 0 1-7 7H8l-5 3 2-5a7 7 0 1 1 16-5Z" />
        </>
      )}
    </svg>
  );
}
