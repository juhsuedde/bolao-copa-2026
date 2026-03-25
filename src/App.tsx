import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import Jogos from './pages/Jogos';
import Especiais from './pages/Especiais';
import Ranking from './pages/Ranking';
import BottomNav from './layout/BottomNav';
import type { Tab } from './types';

function TabNavigator({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = (): Tab => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/jogos')) return 'jogos';
    if (path.startsWith('/especiais')) return 'especiais';
    if (path.startsWith('/ranking')) return 'ranking';
    return 'home';
  };

  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case 'home': navigate('/'); break;
      case 'jogos': navigate('/jogos'); break;
      case 'especiais': navigate('/especiais'); break;
      case 'ranking': navigate('/ranking'); break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-md bg-bolao-bg min-h-screen shadow-2xl relative flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <BottomNav currentTab={getCurrentTab()} onChangeTab={handleTabChange} />
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bolao-bg font-display text-bolao-green text-2xl tracking-widest">
        ⚽ CARREGANDO...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <TabNavigator>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jogos" element={<Jogos />} />
        <Route path="/especiais" element={<Especiais />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </TabNavigator>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}