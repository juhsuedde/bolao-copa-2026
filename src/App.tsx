import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import Jogos from './pages/Jogos';
import Especiais from './pages/Especiais';
import Ranking from './pages/Ranking';
import BottomNav from './layout/BottomNav';

export type Tab = 'home' | 'jogos' | 'especiais' | 'ranking';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bolao-bg font-display text-bolao-green text-2xl tracking-widest">
        ⚽ CARREGANDO...
      </div>
    );
  }

  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home': return <Home />;
      case 'jogos': return <Jogos />;
      case 'especiais': return <Especiais />;
      case 'ranking': return <Ranking />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-md bg-bolao-bg min-h-screen shadow-2xl relative flex flex-col">
        <main className="flex-1 pb-24">
          {renderTabContent()}
        </main>
        <BottomNav currentTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}