import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type LeaderboardEntry = {
  points: number;
  user: {
    name: string;
  };
};

export default function Ranking() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      // Busca os pontos e o nome do usuário fazendo o join com a tabela users
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          points,
          user:users(name)
        `)
        .order('points', { ascending: false });

      if (data) setLeaderboard(data as unknown as LeaderboardEntry[]);
      if (error) console.error("Erro no ranking:", error);
      setLoading(false);
    }

    fetchRanking();
  }, []);

  if (loading) return <div className="p-10 text-center text-bolao-muted">Carregando classificação...</div>;

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="px-5 pt-8">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide uppercase">Ranking</h1>
        <p className="text-xs text-bolao-muted mt-1 uppercase tracking-widest font-semibold">Classificação Geral</p>
      </div>

      <div className="px-5">
        <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl overflow-hidden shadow-sm">
          {leaderboard.length === 0 ? (
            <div className="p-10 text-center text-sm text-bolao-muted">Nenhum ponto marcado ainda.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-bolao-border">
                  <th className="px-4 py-3 text-[10px] font-bold text-bolao-muted uppercase tracking-wider w-16">Pos</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-bolao-muted uppercase tracking-wider">Participante</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-bolao-muted uppercase tracking-wider text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className="border-b border-bolao-border last:border-0 active:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold 
                        ${index === 0 ? 'bg-bolao-gold-light text-bolao-gold border border-bolao-gold/30' : 
                          index === 1 ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                          index === 2 ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-bolao-muted'}`}>
                        {index + 1}º
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-bolao-text">
                        {entry.user?.name || 'Anônimo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-display text-lg text-bolao-green">{entry.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}