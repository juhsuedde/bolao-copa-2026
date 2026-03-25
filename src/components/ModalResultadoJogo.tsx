import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../pages/Jogos';

type UserPick = {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number;
  extra_time_winner: string | null;
  penalties_winner: string | null;
  user: { name: string; avatar_url: string | null };
};

type ModalResultadoJogoProps = {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];

export default function ModalResultadoJogo({ isOpen, onClose, match }: ModalResultadoJogoProps) {
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && match) {
      fetchPicks();
    }
  }, [isOpen, match]);

  const fetchPicks = async () => {
    if (!match) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('match_picks')
      .select(`
        user_id,
        home_score,
        away_score,
        points,
        extra_time_winner,
        penalties_winner,
        user:users(name, avatar_url)
      `)
      .eq('match_id', match.id)
      .order('points', { ascending: false });

    if (error) {
      console.error('Erro ao buscar palpites:', error);
    } else {
      setPicks(data as unknown as UserPick[]);
    }
    setLoading(false);
  };

  if (!isOpen || !match) return null;

  const isKnockout = match.stage !== 'group_stage';

  const getPtsText = (points: number) => {
    if (points >= 8) return `+${points} pts · exato!`;
    if (points > 0) return `+${points} pts`;
    return '0 pts';
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-bolao-text/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform">
        <div className="bg-bolao-bg rounded-t-3xl pt-2 px-5 pb-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">

          <div className="w-12 h-1 bg-bolao-border rounded-full mx-auto mb-6 opacity-60" />

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-display uppercase tracking-widest text-bolao-text mb-1">
                Resultado do Jogo
              </h2>
              <p className="text-[10px] text-bolao-muted">
                Palpites de {picks.length} participante{picks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-bolao-muted hover:text-bolao-text">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Card do Jogo */}
          <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl p-5 mb-6">
            <div className="text-center mb-4">
              <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
                {isKnockout
                  ? match.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : match.home?.group_name
                  ? `Grupo ${match.home.group_name}`
                  : 'Fase de Grupos'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Time da Casa */}
              <div className="flex-1 flex flex-col items-center">
                {match.home?.flag_url ? (
                  <img
                    src={match.home.flag_url}
                    alt={match.home.name}
                    className="w-12 h-8 object-cover rounded shadow-sm border border-bolao-border mb-3"
                  />
                ) : (
                  <span className="text-3xl mb-3">⚽</span>
                )}
                <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                  {match.home?.name || match.home_team}
                </span>
              </div>

              {/* Placar */}
              <div className="flex flex-col items-center px-4">
                <div className="bg-bolao-bg rounded-xl px-4 py-2 border border-bolao-border">
                  <span className="font-mono text-2xl font-bold text-bolao-text">
                    {match.home_score ?? '-'}
                    <span className="text-bolao-muted text-sm mx-1">x</span>
                    {match.away_score ?? '-'}
                  </span>
                </div>
                <span className="text-[9px] text-bolao-green font-semibold mt-2 uppercase tracking-wider">
                  Finalizado
                </span>
              </div>

              {/* Time Visitante */}
              <div className="flex-1 flex flex-col items-center">
                {match.away?.flag_url ? (
                  <img
                    src={match.away.flag_url}
                    alt={match.away.name}
                    className="w-12 h-8 object-cover rounded shadow-sm border border-bolao-border mb-3"
                  />
                ) : (
                  <span className="text-3xl mb-3">⚽</span>
                )}
                <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                  {match.away?.name || match.away_team}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Palpites */}
          <div>
            <h3 className="text-[11px] font-bold text-bolao-text uppercase tracking-widest mb-3">
              Palpites dos Participantes
            </h3>

            {loading ? (
              <div className="text-center py-8 text-bolao-muted text-sm">
                Carregando palpites...
              </div>
            ) : picks.length === 0 ? (
              <div className="text-center py-8 text-bolao-muted text-sm border border-dashed border-bolao-border rounded-xl">
                Nenhum palpite registrado para este jogo.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {picks.map((pick, index) => (
                  <div
                    key={pick.user_id}
                    className="bg-bolao-bg-card border border-bolao-border rounded-xl p-3 flex items-center gap-3"
                  >
                    {/* Posição */}
                    <div className="w-5 text-center">
                      <span className={`text-[11px] font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-500' :
                        index === 2 ? 'text-amber-700' :
                        'text-bolao-muted'
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-bolao-bg3 border border-bolao-border flex items-center justify-center text-sm flex-shrink-0">
                      {pick.user?.avatar_url ? (
                        <img
                          src={pick.user.avatar_url}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                        />
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-bolao-muted">
                        {pick.home_score} x {pick.away_score}
                      </span>
                      {isKnockout && pick.extra_time_winner && (
                        <span className="text-[9px] text-bolao-muted bg-bolao-bg rounded px-1.5 py-0.5 border border-bolao-border">
                          +ET
                        </span>
                      )}
                    </div>

                    {/* Pontuação */}
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      pick.points >= 8
                        ? 'bg-bolao-green-light text-bolao-green'
                        : pick.points > 0
                        ? 'bg-bolao-green-light text-bolao-green'
                        : 'bg-bolao-red-light text-bolao-red'
                    }`}>
                      {getPtsText(pick.points)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legenda de Pontuação */}
          <div className="mt-6 pt-4 border-t border-bolao-border">
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-bolao-green"></span>
                <span className="text-[10px] text-bolao-muted">Placar exato (+8 pts)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-bolao-green-light border border-bolao-green-mid"></span>
                <span className="text-[10px] text-bolao-muted">Parcial (+3 a +5 pts)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-bolao-red"></span>
                <span className="text-[10px] text-bolao-muted">Errou (0 pts)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}