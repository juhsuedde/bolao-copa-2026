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

  // Pontuação máxima possível depende da fase
  const maxExact = isKnockout ? 10 : 8;
  const winnerPts = isKnockout ? 4 : 3;

  const getPtsBadge = (points: number) => {
    if (points === 0) return (
      <span className="text-[10px] font-bold bg-bolao-red-light text-bolao-red px-2 py-1 rounded-full">
        0 pts
      </span>
    );
    if (points >= maxExact) return (
      <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-1 rounded-full">
        +{points} pts · exato!
      </span>
    );
    return (
      <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-1 rounded-full">
        +{points} pts
      </span>
    );
  };

  const stageLabel = isKnockout
    ? (match.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : match.home?.group_name
    ? `Grupo ${match.home.group_name}`
    : 'Fase de grupos';

  return (
    <>
      <div className="fixed inset-0 bg-bolao-text/60 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-bolao-bg rounded-t-3xl pt-2 px-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">

          <div className="w-12 h-1 bg-bolao-border rounded-full mx-auto mb-5 opacity-60" />

          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-sm font-display uppercase tracking-widest text-bolao-text">
                Resultado do jogo
              </h2>
              <p className="text-[10px] text-bolao-muted mt-0.5">
                {picks.length} palpite{picks.length !== 1 ? 's' : ''} registrado{picks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-bolao-muted">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Card do jogo */}
          <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl p-4 mb-5">
            <div className="text-center mb-3">
              <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
                {stageLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex flex-col items-center gap-2">
                {match.home?.flag_url ? (
                  <img src={match.home.flag_url} alt={match.home.name} className="w-11 h-8 object-cover rounded shadow-sm border border-bolao-border" />
                ) : <span className="text-3xl">⚽</span>}
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {match.home?.name || match.home_team}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="bg-bolao-bg rounded-xl px-4 py-2 border border-bolao-border">
                  <span className="font-mono text-2xl font-bold text-bolao-text">
                    {match.home_score}
                    <span className="text-bolao-muted text-sm mx-1">x</span>
                    {match.away_score}
                  </span>
                </div>
                <span className="text-[9px] text-bolao-green font-semibold uppercase tracking-wider">
                  Finalizado
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                {match.away?.flag_url ? (
                  <img src={match.away.flag_url} alt={match.away.name} className="w-11 h-8 object-cover rounded shadow-sm border border-bolao-border" />
                ) : <span className="text-3xl">⚽</span>}
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {match.away?.name || match.away_team}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de palpites */}
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-bolao-muted uppercase tracking-widest mb-3">
              Palpites dos participantes
            </h3>

            {loading ? (
              <div className="text-center py-8 text-bolao-muted text-sm">Carregando...</div>
            ) : picks.length === 0 ? (
              <div className="text-center py-8 text-bolao-muted text-sm border border-dashed border-bolao-border rounded-xl">
                Nenhum palpite registrado.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {picks.map((pick, index) => (
                  <div
                    key={pick.user_id}
                    className="bg-bolao-bg-card border border-bolao-border rounded-xl px-3 py-2.5 flex items-center gap-3"
                  >
                    {/* Posição */}
                    <span className={`text-[11px] font-bold w-4 text-center shrink-0 ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-700' :
                      'text-bolao-muted'
                    }`}>
                      {index + 1}
                    </span>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-bolao-bg border border-bolao-border flex items-center justify-center text-sm shrink-0 overflow-hidden">
                      {pick.user?.avatar_url ? (
                        <img src={pick.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        AVATARS[pick.user_id.charCodeAt(0) % AVATARS.length]
                      )}
                    </div>

                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium truncate block">
                        {pick.user?.name || 'Participante'}
                      </span>
                    </div>

                    {/* Palpite */}
                    <span className="font-mono text-[12px] text-bolao-muted shrink-0">
                      {pick.home_score}–{pick.away_score}
                    </span>

                    {/* Badge de pontuação */}
                    <div className="shrink-0">
                      {getPtsBadge(pick.points)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="pt-4 border-t border-bolao-border flex flex-wrap gap-x-4 gap-y-2 justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bolao-green inline-block" />
              <span className="text-[10px] text-bolao-muted">Exato (+{maxExact} pts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bolao-green-mid inline-block" />
              <span className="text-[10px] text-bolao-muted">Vencedor (+{winnerPts} pts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bolao-red inline-block" />
              <span className="text-[10px] text-bolao-muted">Erro (0 pts)</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}