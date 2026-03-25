import type { Match, Pick } from '../types';
import { STAGE_LABELS } from '../types';

interface MatchCardProps {
  match: Match;
  pick?: Pick;
  isLocked: boolean;
  isLive: boolean;
  liveMinute: number;
  formatTime: (date: string) => string;
  onClick: () => void;
}

export default function MatchCard({
  match,
  pick,
  isLocked,
  isLive,
  liveMinute,
  formatTime,
  onClick,
}: MatchCardProps) {
  const finished = match.home_score !== null && match.away_score !== null;
  const isKnockout = match.stage !== 'group_stage';
  const stageLabel = isKnockout
    ? (STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, ' '))
    : match.home?.group_name ? `Grupo ${match.home.group_name}` : 'Fase de grupos';

  const getPtsBadge = () => {
    if (!pick) return null;
    if (!finished || isLive) return (
      <span className="text-[10px] font-bold bg-bolao-bg border border-bolao-border text-bolao-muted px-2 py-0.5 rounded-full">
        Aguardando
      </span>
    );
    if (pick.points === 0) return (
      <span className="text-[10px] font-bold bg-bolao-red-light text-bolao-red px-2 py-0.5 rounded-full">
        0 pts
      </span>
    );
    return (
      <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-0.5 rounded-full">
        +{pick.points} pts{pick.points >= 8 ? ' · exato!' : ''}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`bg-bolao-bg-card border rounded-[9px] px-3 py-[9px] transition-colors cursor-pointer ${
        finished && !isLive
          ? 'opacity-55 border-bolao-border active:bg-gray-50'
          : pick
          ? 'border-l-[3px] border-bolao-green-mid active:bg-gray-50'
          : isLocked
          ? 'opacity-70 border-bolao-border'
          : 'border-bolao-border active:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-center mb-[7px]">
        <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
          {stageLabel}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-bolao-red tracking-[0.07em]">
            <span className="inline-block w-[5px] h-[5px] rounded-full bg-bolao-red animate-pulse" />
            AO VIVO {liveMinute}'
          </span>
        ) : (
          <span className="text-[10px] text-bolao-muted font-mono">{formatTime(match.match_date)}</span>
        )}
      </div>

      <div className="flex items-center">
        <div className="flex-1 flex items-center justify-end gap-2 pr-3">
          <span className="text-[13px] font-medium text-right leading-tight">
            {match.home?.name || match.home_team}
          </span>
          {match.home?.flag_url ? (
            <img src={match.home.flag_url} alt={match.home.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border shrink-0" />
          ) : <span className="text-[18px] shrink-0">⚽</span>}
        </div>

        <div className="w-[52px] text-center flex-shrink-0 bg-bolao-bg rounded p-1 border border-bolao-border">
          {finished ? (
            <span className="font-mono text-[15px] font-bold text-bolao-text">
              {match.home_score}
              <span className="text-bolao-muted text-[10px] mx-0.5">x</span>
              {match.away_score}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-bolao-muted block py-1">VS</span>
          )}
        </div>

        <div className="flex-1 flex items-center gap-2 pl-3">
          {match.away?.flag_url ? (
            <img src={match.away.flag_url} alt={match.away.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border shrink-0" />
          ) : <span className="text-[18px] shrink-0">⚽</span>}
          <span className="text-[13px] font-medium text-left leading-tight">
            {match.away?.name || match.away_team}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-[7px] pt-[6px] border-t border-bolao-border">
        <div className="flex items-center gap-1.5">
          {finished && !isLive ? (
            <span className="text-[11px] text-bolao-muted font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ver palpites
            </span>
          ) : pick ? (
            <span className="text-[11px] text-bolao-muted">
              Palpite: <strong className="text-bolao-text font-mono">{pick.home_score}–{pick.away_score}</strong>
            </span>
          ) : isLocked ? (
            <span className="text-[11px] text-bolao-red font-medium">Sem palpite</span>
          ) : (
            <span className="text-[11px] text-bolao-green font-semibold">Palpitar agora →</span>
          )}
        </div>
        {getPtsBadge() ?? <span className="text-[10px] text-bolao-muted">—</span>}
      </div>
    </div>
  );
}