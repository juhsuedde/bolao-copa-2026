import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

type RankUser = {
  user_id: string;
  total_points: number;
  user: {
    name: string;
    avatar_url: string | null;
  };
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];
const FIRST_MATCH_DATE = new Date('2026-06-11T00:00:00Z');

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreCopaBanner, setShowPreCopaBanner] = useState(false);

  useEffect(() => {
    setShowPreCopaBanner(new Date() < FIRST_MATCH_DATE);

    async function fetchRanking() {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          total_points,
          user:users(name, avatar_url)
        `)
        .order('total_points', { ascending: false });

      if (data && !error) {
        setRanking(data as unknown as RankUser[]);
      } else {
        showToast('Erro ao carregar ranking', 'error');
      }
      setLoading(false);
    }

    fetchRanking();
  }, [showToast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse-glow inline-block">⚽</div>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const myRankIndex = ranking.findIndex(r => r.user_id === user?.id);
  const myData = myRankIndex !== -1 ? ranking[myRankIndex] : null;
  const myPosition = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const maxPoints = ranking.length > 0 ? ranking[0].total_points : 1;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="screen-header">
        <h1 className="screen-title">Início</h1>
        <span className="hchip green">Bolão da Copa 2026</span>
      </div>

      <div className="scroll" style={{ padding: '12px 20px 0' }}>
        {/* Hero card */}
        <div className="hero-gradient rounded-2xl p-5 text-white mb-5 animate-slide-down"
          style={{ boxShadow: 'var(--shadow-hero)' }}>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p style={{ fontSize: '11px', opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Sua pontuação
              </p>
              <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
                {myData?.user?.name || user?.user_metadata?.full_name || 'Jogador'}
              </p>
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '14px',
              opacity: 0.6,
              letterSpacing: '2px',
            }}>
              2026
            </div>
          </div>

          <div className="flex items-end justify-between mt-4 relative z-10">
            <div>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '42px',
                fontWeight: 700,
                lineHeight: 1,
              }}>
                {myData?.total_points ?? 0}
              </span>
              <span style={{ fontSize: '14px', opacity: 0.7, marginLeft: '4px' }}>pts</span>
            </div>
            <div className="text-right">
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '24px',
                fontWeight: 600,
              }}>
                {myPosition ? `${myPosition}º` : '–'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                {myPosition ? 'lugar' : 'sem pts'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {maxPoints > 0 && (
            <div className="progress-bar mt-4 relative z-10" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="progress-bar-fill" style={{
                width: `${Math.min(100, ((myData?.total_points ?? 0) / maxPoints) * 100)}%`,
                background: 'rgba(255,255,255,0.5)',
              }} />
            </div>
          )}
        </div>

        {/* Ranking preview */}
        <div className="glass-card p-4 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '20px',
            letterSpacing: '1px',
            color: 'var(--text)',
            marginBottom: '12px',
          }}>
            Ranking do bolão
          </h2>

          <div className="flex flex-col gap-2 stagger-children">
            {ranking.map((row, index) => {
              const isMe = row.user_id === user?.id;
              const position = index + 1;

              return (
                <div key={row.user_id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isMe ? 'border border-[var(--green-mid)]' : ''
                  }`}
                  style={{
                    background: isMe ? 'rgba(232,245,239,0.6)' : 'transparent',
                  }}>
                  {/* Position / Medal */}
                  <div className="w-7 text-center flex-shrink-0">
                    {index < 3 ? (
                      <span style={{ fontSize: '16px' }}>{MEDALS[index]}</span>
                    ) : (
                      <span className="p-num">{position}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`p-av ${isMe ? 'me' : ''}`}>
                    {row.user?.avatar_url ? (
                      <img src={row.user.avatar_url} alt={row.user.name}
                        className="w-full h-full rounded-full object-cover" />
                    ) : (
                      AVATARS[index] ?? '👤'
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="p-name truncate">
                      {row.user?.name || 'Sem nome'}
                      {isMe && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: 'var(--green)',
                          background: 'var(--green-light)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          marginLeft: '6px',
                        }}>
                          você
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="p-pts gr flex-shrink-0">{row.total_points}</div>
                </div>
              );
            })}
          </div>

          {ranking.length === 0 && (
            <div className="text-center py-8">
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>🏟️</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                Ninguém pontuou ainda. Seja o primeiro!
              </p>
            </div>
          )}
        </div>

        {/* Pre-Copa banner */}
        {showPreCopaBanner && (
          <div className="glass-card p-5 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'var(--gold-light)', border: '1px solid var(--gold-border)' }}>
                ⏳
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>A Copa ainda não começou</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>
                  Você começará a pontuar assim que a bola rolar!
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--green-light)', border: '1px solid var(--green-mid)' }}>
                <span className="text-lg flex-shrink-0">⚽</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>Aba Jogos</p>
                  <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Pode palpitar quando quiser, mas 10 minutos antes de cada partida os jogos travam.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--gold-light)', border: '1px solid var(--gold-border)' }}>
                <span className="text-lg flex-shrink-0">★</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>Aba Especiais</p>
                  <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Vote nos classificados por grupo, times da final, campeão e artilheiro antes do primeiro jogo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-3 text-center mb-6 rounded-xl transition-all active:scale-95"
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
          }}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}
