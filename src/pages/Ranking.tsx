import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

type LeaderboardEntry = {
  user_id: string;
  total_points: number;
  group_points: number;
  match_points: number;
  special_points: number;
  user: { name: string; avatar_url: string | null };
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const { user } = useAuth();
  const { showToast } = useToast();
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
          user:user_id(name, avatar_url)
        `)
        .order('total_points', { ascending: false });

      if (data) setLeaderboard(data as unknown as LeaderboardEntry[]);
      if (error) showToast('Erro ao carregar ranking', 'error');
      setLoading(false);
    }
    fetchRanking();
  }, [showToast]);

  const maxPoints = leaderboard.length > 0 ? leaderboard[0].total_points : 1;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="mb-2 animate-pulse inline-block">
          <span className="text-3xl block font-sans text-black bg-transparent border-none outline-none shadow-none" style={{ textShadow: 'none' }}>
            📊
          </span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Carregando ranking...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="screen-header">
        <h1 className="screen-title">Ranking</h1>
        <span className="hchip green">{leaderboard.length} jogadores</span>
      </div>

      <div className="scroll">
        {leaderboard.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p style={{ fontSize: '36px', marginBottom: '12px' }}>🏟️</p>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Nenhuma pontuação registrada ainda.
            </p>
          </div>
        )}

        <div className="rklist stagger-children">
          {leaderboard.map((entry, index) => {
            const isMe = entry.user_id === user?.id;
            const isExpanded = expanded === entry.user_id;

            return (
              <div key={entry.user_id}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : entry.user_id)}
                  className={`rk-row ${isMe ? 'me' : ''} ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Position */}
                  <div className="w-7 text-center flex-shrink-0">
                    {index < 3 ? (
                      <span style={{ fontSize: '18px' }}>{MEDALS[index]}</span>
                    ) : (
                      <span className="p-num">{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`p-av ${isMe ? 'me' : ''}`}>
                    {entry.user?.avatar_url ? (
                      <img src={entry.user.avatar_url} alt={entry.user.name}
                        className="w-full h-full rounded-full object-cover" />
                    ) : (
                      AVATARS[index] ?? '👤'
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-info">
                    <div className="p-name">
                      {entry.user?.name || 'Participante'}
                      {isMe && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, color: 'var(--green)',
                          background: 'var(--green-light)', padding: '1px 6px',
                          borderRadius: '10px', marginLeft: '6px',
                        }}>
                          você
                        </span>
                      )}
                    </div>
                    <div className="p-det">
                      {entry.match_points} pts jogos · {entry.group_points} pts grupos
                    </div>
                    {/* Progress bar */}
                    {maxPoints > 0 && (
                      <div className="progress-bar mt-1.5" style={{ width: '80%' }}>
                        <div className="progress-bar-fill"
                          style={{ width: `${Math.min(100, (entry.total_points / maxPoints) * 100)}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="p-pts gr">{entry.total_points}</div>

                  {/* Chevron */}
                  <span className={`chev ${isExpanded ? 'open' : ''}`}>▼</span>
                </div>

                {/* Expanded details */}
                <div className={`rk-exp ${isExpanded ? 'open' : ''}`}>
                  <div className="bd-row">
                    <span className="bd-l">Grupos acertados</span>
                    <span className="bd-v">+{entry.group_points} pts</span>
                  </div>
                  <div className="bd-row">
                    <span className="bd-l">Palpites de jogos</span>
                    <span className="bd-v">+{entry.match_points} pts</span>
                  </div>
                  <div className="bd-row">
                    <span className="bd-l">Especiais</span>
                    <span className="bd-v">+{entry.special_points} pts</span>
                  </div>
                  <div className="bd-row">
                    <span className="bd-l total">Total</span>
                    <span className="bd-v total">{entry.total_points} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
