type Tab = 'home' | 'jogos' | 'especiais' | 'ranking';

interface BottomNavProps {
  currentTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export default function BottomNav({ currentTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    {
      id: 'home' as Tab,
      label: 'Início',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      id: 'jogos' as Tab,
      label: 'Jogos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3c2 2.5 2 6.5 0 9s-2 6.5 0 9M3 9h18M3 15h18"/>
        </svg>
      )
    },
    {
      id: 'especiais' as Tab,
      label: 'Especiais',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    {
      id: 'ranking' as Tab,
      label: 'Ranking',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 h-[62px] bg-bolao-bg/90 backdrop-blur-md border-t border-bolao-border flex items-center justify-between pb-safe px-2">
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