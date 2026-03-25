import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { useUserRole } from './hooks/useUserRole';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
import Login from './pages/Login';
import Home from './pages/Home';
import Jogos from './pages/Jogos';
import Especiais from './pages/Especiais';
import Ranking from './pages/Ranking';
import Admin from './pages/Admin';
import BottomNav from './layout/BottomNav';
import type { Tab } from './layout/BottomNav';

function TabNavigator({ children, showAdmin }: { children: React.ReactNode; showAdmin: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = (): Tab => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/jogos')) return 'jogos';
    if (path.startsWith('/especiais')) return 'especiais';
    if (path.startsWith('/ranking')) return 'ranking';
    if (path.startsWith('/admin')) return 'admin';
    return 'home';
  };

  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case 'home': navigate('/'); break;
      case 'jogos': navigate('/jogos'); break;
      case 'especiais': navigate('/especiais'); break;
      case 'ranking': navigate('/ranking'); break;
      case 'admin': navigate('/admin'); break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-md bg-bolao-bg min-h-screen shadow-2xl relative flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <BottomNav currentTab={getCurrentTab()} onChangeTab={handleTabChange} showAdmin={showAdmin} />
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bolao-bg font-display text-bolao-green text-2xl tracking-widest">
        ⚽ CARREGANDO...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <TabNavigator showAdmin={isAdmin}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jogos" element={<Jogos />} />
        <Route path="/especiais" element={<Especiais />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </TabNavigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}