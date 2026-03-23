import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import BottomNav from './layout/BottomNav';
import Jogos from './pages/Jogos';

// Páginas temporárias (placeholders) para podermos navegar
const Home = () => <div className="p-6 mt-10 text-center text-bolao-muted">Página Início em construção</div>;
const Especiais = () => <div className="p-6 mt-10 text-center text-bolao-muted">Palpites Especiais em construção</div>;
const Ranking = () => <div className="p-6 mt-10 text-center text-bolao-muted">Ranking em construção</div>;

type Tab = 'home' | 'jogos' | 'especiais' | 'ranking';

function MainApp() {
  const { session, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('jogos'); // Iniciando na aba Jogos para testarmos

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-bolao-muted">Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-bolao-bg shadow-2xl overflow-hidden">
      
      {/* Área principal rolável */}
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {currentTab === 'home' && <Home />}
        {currentTab === 'jogos' && <Jogos />}
        {currentTab === 'especiais' && <Especiais />}
        {currentTab === 'ranking' && <Ranking />}
      </main>
      
      {/* Navegação Inferior fixada */}
      <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
      
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}