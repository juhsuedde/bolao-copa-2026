export type Tab = 'home' | 'jogos' | 'especiais' | 'ranking' | 'admin';

interface BottomNavProps {
  currentTab: Tab;
  onChangeTab: (tab: Tab) => void;
  showAdmin?: boolean;
}

export default function BottomNav({ currentTab, onChangeTab, showAdmin }: BottomNavProps) {
  const baseTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Início',
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      id: 'jogos',
      label: 'Jogos',
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10M2 12h20"/>
        </svg>
      )
    },
    {
      id: 'especiais',
      label: 'Especiais',
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )
    },
    {
      id: 'ranking',
      label: 'Ranking',
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M8 21V11M16 21V5M12 21V16"/>
        </svg>
      )
    }
  ];

  const adminTab = {
    id: 'admin' as Tab,
    label: 'Admin',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    )
  };

  const tabs = showAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)]"
      style={{ 
        height: '64px',
        background: 'var(--bg)', // Puxa o fundo do seu novo design
        borderTop: '1px solid var(--border)' // Borda suave para separar do conteúdo
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChangeTab(tab.id)}
          className={`nav-item flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
            currentTab === tab.id ? 'active' : ''
          }`}
          style={{
            color: currentTab === tab.id ? 'var(--green)' : 'var(--muted)',
            background: 'none',
            border: 'none',
          }}
        >
          <span style={{ transition: 'transform 0.2s ease', transform: currentTab === tab.id ? 'scale(1.1)' : 'scale(1)' }}>
            {tab.icon}
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: currentTab === tab.id ? 700 : 500,
            letterSpacing: '0.02em',
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
