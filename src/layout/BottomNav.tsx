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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      id: 'jogos',
      label: 'Jogos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3c2 2.5 2 6.5 0 9s-2 6.5 0 9M3 9h18M3 15h18"/>
        </svg>
      )
    },
    {
      id: 'especiais',
      label: 'Especiais',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    {
      id: 'ranking',
      label: 'Ranking',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
      )
    }
  ];

  const adminTab = {
    id: 'admin' as Tab,
    label: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 15l-6.5 4 2-7L2 9h7l3-7z"/>
      </svg>
    )
  };

  const tabs = showAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20 h-[62px] bg-bolao-bg/90 backdrop-blur-md border-t border-bolao-border flex items-center justify-between pb-safe px-2">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[4px] py-2 transition-all duration-200 ${
              isActive 
                ? 'opacity-100 text-bolao-green scale-105' 
                : 'opacity-40 text-bolao-text'
            }`}
          >
            <div className="flex items-center justify-center w-full">
              {tab.icon}
            </div>
            <span className="text-[10px] font-bold tracking-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}