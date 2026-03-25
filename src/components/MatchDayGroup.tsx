import type { Match, Pick } from '../types';
import MatchCard from './MatchCard';

interface MatchDayGroupProps {
  label: string;
  matches: Match[];
  getPick: (matchId: string) => Pick | undefined;
  isMatchLocked: (date: string) => boolean;
  isLive: (date: string) => boolean;
  liveMinute: (date: string) => number;
  formatTime: (date: string) => string;
  onMatchClick: (match: Match) => void;
  dayRef?: (el: HTMLDivElement | null) => void;
}

export default function MatchDayGroup({
  label,
  matches,
  getPick,
  isMatchLocked,
  isLive,
  liveMinute,
  formatTime,
  onMatchClick,
  dayRef,
}: MatchDayGroupProps) {
  return (
    <div ref={dayRef} className="scroll-mt-24">
      <div className="flex items-center gap-3 py-2">
        <span className="text-[11px] font-bold text-bolao-text uppercase tracking-[0.08em]">{label}</span>
        <div className="flex-1 h-px bg-bolao-border" />
        <span className="text-[10px] text-bolao-muted">
          {matches.length} jogo{matches.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        {matches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            pick={getPick(match.id)}
            isLocked={isMatchLocked(match.match_date)}
            isLive={isLive(match.match_date)}
            liveMinute={liveMinute(match.match_date)}
            formatTime={formatTime}
            onClick={() => onMatchClick(match)}
          />
        ))}
      </div>
    </div>
  );
}