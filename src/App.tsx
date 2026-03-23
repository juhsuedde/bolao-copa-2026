import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import Jogos from './pages/Jogos';
import Especiais from './pages/Especiais';
import Ranking from './pages/Ranking';
import BottomNav from './layout/BottomNav';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  if (loading) return <div className="h-screen flex items-center justify-center bg-bolao-bg font-display text-bolao-green">⚽ CARREGANDO...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Container Centralizado (Simulando um celular) */}
      <div className="w-full max-w-md bg-bolao-bg min-h-screen shadow-2xl relative flex flex-col">
        
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'home' && <Home />}
          {currentTab === 'jogos' && <Jogos />}
          {currentTab === 'especiais' && <Especiais />}
          {currentTab === 'ranking' && <Ranking />}
        </main>
        
        {/* Nav agora respeita o limite do container */}
        <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
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