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

  const rankColor = (i: number) => {
    if (i === 0) return 'g1';
    if (i === 1) return 'g2';
    if (i === 2) return 'g3';
    return '';
  };

  if (loading) return (
    <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando ranking...</div>
  );

  return (
    <div className="flex flex-col pb-20">
      <div className="px-5 pt-5 pb-0 flex items-center justify-between bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Ranking</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {leaderboard.length} jogadores
        </div>
      </div>

      <div className="rklist">
        {leaderboard.length === 0 && (
          <div className="text-center p-10 text-bolao-muted text-sm">
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
                <div className={`p-num ${rankColor(index)}`}>{index + 1}</div>
                <div className={`p-av ${isMe ? 'me' : ''}`}>
                  {entry.user?.avatar_url ? (
                    <img src={entry.user.avatar_url} className="w-full h-full object-cover rounded-full" alt={entry.user.name} />
                  ) : (
                    AVATARS[index] ?? '👤'
                  )}
                </div>
                <div className="p-info">
                  <div className="p-name">
                    {entry.user?.name || 'Participante'}
                    {isMe && <span className="text-[10px] text-bolao-green font-bold ml-1">você</span>}
                  </div>
                  <div className="p-det">
                    {entry.match_points} pts jogos · {entry.group_points} pts grupos
                  </div>
                </div>
                <div className="p-right">
                  <div className={`p-pts ${index < 3 && !isMe ? 'gr' : ''} ${isMe ? 'go' : ''}`}>
                    {entry.total_points}
                  </div>
                </div>
                <div className={`chev ${isExpanded ? 'open' : ''}`}>▼</div>
              </div>

              <div className={`rk-exp ${isExpanded ? 'open' : ''}`}>
                <div className="bd-row">
                  <div className="bd-l">Grupos acertados</div>
                  <div className="bd-v">+{entry.group_points} pts</div>
                </div>
                <div className="bd-row">
                  <div className="bd-l">Palpites de jogos</div>
                  <div className="bd-v">+{entry.match_points} pts</div>
                </div>
                <div className="bd-row">
                  <div className="bd-l">Especiais</div>
                  <div className="bd-v">+{entry.special_points} pts</div>
                </div>
                <div className="bd-row">
                  <div className="bd-l total">Total</div>
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