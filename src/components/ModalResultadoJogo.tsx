import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../types';

type UserPick = {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number;
  extra_time_winner: string | null;
  penalties_winner: string | null;
  user: { name: string; avatar_url: string | null };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];

export default function ModalResultadoJogo({ isOpen, onClose, match }: Props) {
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !match) return;
    setLoading(true);
    supabase
      .from('match_picks')
      .select(`
        user_id,
        home_score,
        away_score,
        points,
        extra_time_winner,
        penalties_winner,
        user:user_id(name, avatar_url)
      `)
      .eq('match_id', match.id)
      .order('points', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Erro ao buscar palpites:', error);
        else setPicks(data as unknown as UserPick[]);
        setLoading(false);
      });
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const isKnockout = match.stage !== 'group_stage';
  const maxExact = isKnockout ? 10 : 8;
  const winnerPts = isKnockout ? 4 : 3;

  const getPtsBadge = (points: number) => {
    if (points === 0) return (
      <span className="hchip" style={{
        background: 'var(--red-light)', color: 'var(--red)',
        border: '1px solid #F0B0AA', fontSize: '10px',
      }}>0 pts</span>
    );
    if (points >= maxExact) return (
      <span className="hchip" style={{
        background: 'var(--gold-light)', color: 'var(--gold)',
        border: '1px solid var(--gold-border)', fontSize: '10px',
      }}>+{points} pts · exato!</span>
    );
    return (
      <span className="hchip" style={{
        background: 'var(--green-light)', color: 'var(--green)',
        border: '1px solid var(--green-mid)', fontSize: '10px',
      }}>+{points} pts</span>
    );
  };

  const stageLabel = isKnockout
    ? (match.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : match.home?.group_name
      ? `Grupo ${match.home.group_name}`
      : 'Fase de grupos';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] modal-overlay animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 z-[100] modal-content p-5 animate-slide-up"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '22px',
            letterSpacing: '1px',
            background: 'var(--gradient-hero)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Resultado do jogo</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
            {picks.length} palpite{picks.length !== 1 ? 's' : ''} registrado{picks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Match result card */}
        <div className="glass-card p-4 mb-5">
          <p className="text-center mb-3" style={{
            fontSize: '10px', fontWeight: 600, color: 'var(--muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>{stageLabel}</p>

          <div className="flex items-center justify-center gap-5">
            <div className="text-center">
              {match.home?.flag_url ? (
                <img src={match.home.flag_url} alt={match.home.name}
                  className="w-10 h-7 object-cover rounded mx-auto mb-1"
                  style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
              ) : <span className="text-xl">⚽</span>}
              <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
                {match.home?.name || match.home_team}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: '28px', fontWeight: 700,
              }}>{match.home_score}</span>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>x</span>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: '28px', fontWeight: 700,
              }}>{match.away_score}</span>
            </div>

            <div className="text-center">
              {match.away?.flag_url ? (
                <img src={match.away.flag_url} alt={match.away.name}
                  className="w-10 h-7 object-cover rounded mx-auto mb-1"
                  style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
              ) : <span className="text-xl">⚽</span>}
              <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
                {match.away?.name || match.away_team}
              </p>
            </div>
          </div>

          <div className="text-center mt-2">
            <span style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--green)',
              background: 'var(--green-light)',
              padding: '2px 10px', borderRadius: '10px',
              border: '1px solid var(--green-mid)',
            }}>Finalizado</span>
          </div>
        </div>

        {/* Picks list */}
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '18px',
          letterSpacing: '0.5px',
          marginBottom: '10px',
        }}>Palpites dos participantes</h3>

        {loading ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-2xl mb-2 animate-pulse-glow inline-block">📋</div>
            <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Carregando...</p>
          </div>
        ) : picks.length === 0 ? (
          <div className="text-center py-6">
            <p style={{ fontSize: '24px', marginBottom: '6px' }}>🤷</p>
            <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Nenhum palpite registrado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 stagger-children">
            {picks.map((pick, index) => (
              <div key={pick.user_id}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{
                  background: index === 0 && pick.points > 0 ? 'rgba(253,245,224,0.5)' : 'transparent',
                  border: index === 0 && pick.points > 0 ? '1px solid var(--gold-border)' : '1px solid transparent',
                }}>
                <span className="p-num" style={{
                  color: index === 0 ? 'var(--gold)' : index < 3 ? 'var(--green)' : 'var(--muted)',
                  fontWeight: index < 3 ? 700 : 400,
                }}>{index + 1}</span>

                <div className="p-av">
                  {pick.user?.avatar_url ? (
                    <img src={pick.user.avatar_url} alt=""
                      className="w-full h-full rounded-full object-cover" />
                  ) : (
                    AVATARS[pick.user_id.charCodeAt(0) % AVATARS.length]
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="p-name truncate">{pick.user?.name || 'Participante'}</p>
                </div>

                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  flexShrink: 0,
                }}>
                  {pick.home_score}–{pick.away_score}
                </span>

                <div className="flex-shrink-0">
                  {getPtsBadge(pick.points)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '10px', color: 'var(--gold)' }}>● Exato (+{maxExact} pts)</span>
          <span style={{ fontSize: '10px', color: 'var(--green)' }}>● Vencedor (+{winnerPts} pts)</span>
          <span style={{ fontSize: '10px', color: 'var(--red)' }}>● Erro (0 pts)</span>
        </div>
      </div>
    </>
  );
}
