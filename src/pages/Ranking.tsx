import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type LeaderboardEntry = {
  user_id: string;
  total_points: number;
  group_points: number;
  match_points: number;
  special_points: number;
  user: { name: string; avatar_url: string | null };
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];

export default function Ranking() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          total_points,
          group_points,
          match_points,
          special_points,
          user:users(name, avatar_url)
        `)
        .order('total_points', { ascending: false });

      if (data) setLeaderboard(data as unknown as LeaderboardEntry[]);
      if (error) console.error(error);
      setLoading(false);
    }
    fetchRanking();
  }, []);

  const rankColorClass = (i: number) => {
    if (i === 0) return 'g1'; // Ouro
    if (i === 1) return 'g2'; // Prata
    if (i === 2) return 'g3'; // Bronze
    return '';
  };

  if (loading) return (
    <div className="p-10 text-center font-display text-xs tracking-widest text-bolao-muted">
      Carregando ranking...
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Header fixo da página */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Ranking</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {leaderboard.length} jogadores
        </div>
      </div>

      <div className="rklist">
        {leaderboard.length === 0 && (
          <div className="text-center p-10 text-bolao-muted text-sm border border-dashed border-bolao-border rounded-xl mx-5">
            Nenhuma pontuação registrada ainda.
          </div>
        )}

        {leaderboard.map((entry, index) => {
          const isMe = entry.user_id === user?.id;
          const isExpanded = expanded === entry.user_id;

          return (
            <div key={entry.user_id}>
              <div
                className={`rk-row ${isMe ? 'me' : ''} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpanded(isExpanded ? null : entry.user_id)}
              >
                {/* Posição */}
                <div className={`p-num ${rankColorClass(index)}`}>{index + 1}</div>
                
                {/* Avatar */}
                <div className={`p-av ${isMe ? 'me' : ''}`}>
                  {entry.user?.avatar_url ? (
                    <img src={entry.user.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                  ) : (
                    // Usa o charCode do ID para o emoji ser sempre o mesmo para o usuário
                    AVATARS[entry.user_id.charCodeAt(0) % AVATARS.length]
                  )}
                </div>

                {/* Nome e Resumo */}
                <div className="p-info">
                  <div className="p-name flex items-center gap-1">
                    {entry.user?.name || 'Participante'}
                    {isMe && <span className="text-[9px] bg-bolao-green text-white px-1.5 py-0.5 rounded ml-1 uppercase font-bold">você</span>}
                  </div>
                  <div className="p-det">
                    {entry.match_points} pts jogos · {entry.group_points} pts grupos
                  </div>
                </div>

                {/* Pontos Totais */}
                <div className="p-right">
                  <div className={`p-pts ${index < 3 && !isMe ? 'gr' : ''} ${isMe ? 'go' : ''}`}>
                    {entry.total_points}
                  </div>
                </div>

                <svg 
                  className={`w-3 h-3 ml-1 text-bolao-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Detalhamento Expandido */}
              <div className={`rk-exp ${isExpanded ? 'open' : ''}`}>
                <div className="bd-row">
                  <div className="bd-l">Palpites de jogos</div>
                  <div className="bd-v">+{entry.match_points} pts</div>
                </div>
                <div className="bd-row">
                  <div className="bd-l">Grupos (Exatos/Parciais)</div>
                  <div className="bd-v">+{entry.group_points} pts</div>
                </div>
                <div className="bd-row">
                  <div className="bd-l">Especiais (Final/Artilheiro)</div>
                  <div className="bd-v">+{entry.special_points} pts</div>
                </div>
                <div className="bd-row" style={{ background: 'var(--bg3)' }}>
                  <div className="bd-l total">Pontuação Total</div>
                  <div className="bd-v total">{entry.total_points} pts</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}