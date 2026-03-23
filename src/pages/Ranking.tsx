import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type LeaderboardEntry = {
  points: number;
  user: { name: string };
  exact_guesses?: number;
  total_guesses?: number;
  groups_correct?: number;
  delta?: number; // variação de hoje
  avatar?: string;
};

export default function Ranking() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard')
        .select('points, user:users(name), exact_guesses, total_guesses, groups_correct, delta, avatar')
        .order('points', { ascending: false });

      if (data) {
        // Adiciona dados mockados para campos que podem não existir ainda no backend
        const enrichedData = data.map((entry: any, index: number) => ({
          ...entry,
          exact_guesses: entry.exact_guesses ?? Math.floor(entry.points / 20),
          total_guesses: entry.total_guesses ?? Math.floor(entry.points / 8),
          groups_correct: entry.groups_correct ?? Math.floor(Math.random() * 4) + 1,
          delta: entry.delta ?? [18, 8, 5, -2, 0, 12, 3][index] ?? 0,
          avatar: entry.avatar ?? ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥'][index] ?? '👤'
        }));
        setLeaderboard(enrichedData);
      }
      if (error) console.error(error);
      setLoading(false);
    }
    fetchRanking();
  }, []);

  // Dados do usuário logado (você pode pegar do contexto/auth)
  const currentUser = { name: 'Rafael M.', avatar: '🦊' };
  const currentUserIndex = leaderboard.findIndex(e => e.user?.name === currentUser.name);

  const getRankClass = (index: number) => {
    if (index === 0) return 'g1'; // ouro
    if (index === 1) return 'g2'; // prata
    if (index === 2) return 'g3'; // bronze
    return '';
  };

  const getDeltaClass = (delta: number) => {
    if (delta > 0) return 'p-delta';
    if (delta < 0) return 'p-delta neg';
    return 'p-delta zero';
  };

  const getDeltaText = (delta: number) => {
    if (delta > 0) return `+${delta} hoje`;
    if (delta < 0) return `–${Math.abs(delta)} hoje`;
    return '+0 hoje';
  };

  const toggleExpand = (name: string) => {
    setExpanded(expanded === name ? null : name);
  };

  if (loading) {
    return (
      <div className="screen active" id="s-ranking">
        <div className="screen-header">
          <div className="screen-title">Ranking</div>
          <div className="hchip green">Carregando...</div>
        </div>
        <div className="scroll">
          <div className="p-list" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            Carregando ranking...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="s-ranking">
      <div className="screen-header">
        <div className="screen-title">Ranking</div>
        <div className="hchip green">{leaderboard.length} jogadores</div>
      </div>
      
      <div className="scroll">
        <div className="rklist">
          {leaderboard.map((entry, index) => {
            const isMe = entry.user?.name === currentUser.name;
            const rankClass = getRankClass(index);
            const isExpanded = expanded === entry.user?.name;
            
            return (
              <div key={entry.user?.name || index} id={`wr-${entry.user?.name?.toLowerCase().replace(/\s/g, '') || index}`}>
                <div 
                  className={`rk-row ${isMe ? 'me' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(entry.user?.name || '')}
                >
                  <div className={`p-num ${rankClass}`}>{index + 1}</div>
                  <div className={`p-av ${isMe ? 'me' : ''}`}>{entry.avatar}</div>
                  <div className="p-info">
                    <div className="p-name">
                      {entry.user?.name || 'Participante'}
                      {isMe && <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700, marginLeft: '6px' }}>você</span>}
                    </div>
                    <div className="p-det">
                      {entry.exact_guesses} exatos · {entry.total_guesses} palpites
                    </div>
                  </div>
                  <div className="p-right">
                    <div className={`p-pts ${index < 3 ? 'gr' : ''} ${isMe ? 'go' : ''}`}>
                      {entry.points}
                    </div>
                    <div className={getDeltaClass(entry.delta || 0)}>
                      {getDeltaText(entry.delta || 0)}
                    </div>
                  </div>
                  <div className={`chev ${isExpanded ? 'open' : ''}`}>▼</div>
                </div>
                
                <div className={`rk-exp ${isExpanded ? 'open' : ''}`} id={`re-${entry.user?.name?.toLowerCase().replace(/\s/g, '') || index}`}>
                  <div className="bd-row">
                    <div className="bd-l">Grupos acertados</div>
                    <div className="bd-v">+{entry.groups_correct ? entry.groups_correct * 12 : 0} pts</div>
                  </div>
                  <div className="bd-row">
                    <div className="bd-l">Palpites de jogos</div>
                    <div className="bd-v">+{entry.points - (entry.groups_correct ? entry.groups_correct * 12 : 0) - (entry.exact_guesses || 0)} pts</div>
                  </div>
                  <div className="bd-row">
                    <div className="bd-l">Especiais</div>
                    <div className="bd-v">+{entry.exact_guesses || 0} pts</div>
                  </div>
                  <div className="bd-row">
                    <div className="bd-l total">Total</div>
                    <div className="bd-v total">{entry.points} pts</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {leaderboard.length === 0 && (
            <div className="p-row" style={{ justifyContent: 'center', padding: '20px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                Nenhuma pontuação registrada.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}