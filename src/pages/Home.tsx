import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// Tipagem do retorno do banco com o Join entre leaderboard e users
type RankUser = {
  user_id: string;
  points: number;
  user: {
    name: string;
    avatar_url: string;
  };
};

export default function Home() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      // Faz o SELECT na tabela leaderboard e junta (Join) com os dados da tabela users
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          points,
          user:user_id ( name, avatar_url )
        `)
        .order('points', { ascending: false });

      if (data && !error) {
        setRanking(data as unknown as RankUser[]);
      } else {
        console.error("Erro ao buscar o ranking:", error);
      }
      setLoading(false);
    }

    fetchRanking();
  }, []);

  if (loading) {
    return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando ranking...</div>;
  }

  // Descobre a sua posição no array ordenado
  const myRankIndex = ranking.findIndex(r => r.user_id === user?.id);
  const myData = myRankIndex !== -1 ? ranking[myRankIndex] : null;
  const myPosition = myRankIndex !== -1 ? myRankIndex + 1 : '-';

  return (
    <div className="flex flex-col gap-4 pb-20">
      
      {/* Cabeçalho */}
      <div className="px-5 pt-5 flex items-center justify-between bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Início</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          Copa 2026
        </div>
      </div>

      {/* Card Principal: Seu Desempenho */}
      <div className="mx-5 bg-bolao-green rounded-2xl p-5 text-white relative overflow-hidden shadow-lg mt-2">
        {/* Número 26 decorativo vazado ao fundo */}
        <div className="absolute -right-2 -top-4 font-display text-[120px] text-white opacity-5 select-none pointer-events-none leading-none">
          26
        </div>
        
        <div className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-75 mb-1">
          Sua pontuação
        </div>
        <div className="text-xl font-semibold mb-1 truncate pr-16">
          {myData?.user?.name || 'Visitante'}
        </div>
        <div className="font-mono text-5xl leading-none mt-2 flex items-baseline gap-1">
          {myData?.points || 0} <span className="text-sm font-sans font-normal opacity-75">pts</span>
        </div>
        
        <div className="absolute top-5 right-5 text-center">
          <div className="font-display text-[52px] leading-none opacity-90">
            {myPosition}º
          </div>
          <div className="text-[10px] opacity-75 tracking-wider">
            lugar
          </div>
        </div>
      </div>

      {/* Lista do Ranking Geral */}
      <div className="px-5 mt-2">
        <div className="text-[10px] text-bolao-muted font-semibold tracking-[0.1em] uppercase mb-3">
          Ranking do bolão
        </div>
        
        <div className="flex flex-col gap-2">
          {ranking.map((row, index) => {
            const isMe = row.user_id === user?.id;
            const position = index + 1;
            
            return (
              <div 
                key={row.user_id} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isMe 
                    ? 'bg-bolao-green-light border-bolao-green-mid' 
                    : 'bg-bolao-bg-card border-bolao-border'
                }`}
              >
                {/* Posição */}
                <div className={`font-mono text-xs w-4 text-center shrink-0 ${position <= 3 ? 'text-bolao-gold font-bold' : 'text-bolao-muted'}`}>
                  {position}
                </div>
                
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full bg-bolao-bg border-2 flex items-center justify-center overflow-hidden shrink-0 ${isMe ? 'border-bolao-green' : 'border-bolao-border'}`}>
                  {row.user?.avatar_url ? (
                    <img src={row.user.avatar_url} alt={row.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                </div>
                
                {/* Nome */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1 truncate">
                    {row.user?.name || 'Sem nome'}
                    {isMe && <span className="text-[10px] text-bolao-green font-bold shrink-0">(você)</span>}
                  </div>
                </div>
                
                {/* Pontos */}
                <div className="text-right">
                  <div className={`font-mono text-[15px] font-medium ${isMe ? 'text-bolao-gold' : 'text-bolao-green'}`}>
                    {row.points}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Caso a tabela leaderboard esteja vazia */}
          {ranking.length === 0 && (
            <div className="text-center p-6 text-bolao-muted text-sm border border-dashed border-bolao-border rounded-xl">
              Ninguém pontuou no ranking ainda.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}