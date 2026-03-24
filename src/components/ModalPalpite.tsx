import { useState, useEffect } from 'react';
import type { Match } from '../pages/Jogos';

// Reutiliza o tipo Match do Jogos.tsx — fonte única de verdade
type Pick = {
  home_score: number;
  away_score: number;
};

interface ModalPalpiteProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  currentPick: Pick | null;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
}

export default function ModalPalpite({ isOpen, onClose, match, currentPick, onSave }: ModalPalpiteProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setHomeScore(currentPick?.home_score ?? 0);
      setAwayScore(currentPick?.away_score ?? 0);
    }
  }, [isOpen, currentPick]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(match.id, homeScore, awayScore);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex flex-col justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-bolao-bg-card rounded-t-[24px] border border-bolao-border border-b-0 pb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-bolao-border rounded-full mx-auto mt-3 mb-[18px]" />

        <h2 className="font-display text-xl tracking-wide px-5 text-bolao-text mb-3">Seu palpite</h2>

        {/* Match preview */}
        <div className="mx-5 mb-3 flex items-center bg-bolao-bg border border-bolao-border rounded-xl p-[14px]">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[32px]">⚽</span>
            <span className="text-xs font-semibold">{match.home?.name}</span>
          </div>
          <div className="w-9 text-center font-display text-[18px] text-bolao-muted">VS</div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[32px]">⚽</span>
            <span className="text-xs font-semibold">{match.away?.name}</span>
          </div>
        </div>

        {/* Stepper de placar — melhor UX no mobile do que input numérico */}
        <div className="flex items-center justify-center gap-[10px] px-5 py-1">
          {/* Casa */}
          <div className="flex flex-col items-center gap-[5px]">
            <span className="text-[10px] text-bolao-muted font-semibold tracking-[0.06em] uppercase">
              {match.home?.name}
            </span>
            <div className="flex items-center">
              <button
                onClick={() => setHomeScore(s => Math.max(0, s - 1))}
                className="w-[38px] h-[46px] bg-bolao-bg border border-bolao-border rounded-l-lg flex items-center justify-center text-xl font-light active:bg-bolao-border transition-colors select-none"
              >−</button>
              <div className="w-[50px] h-[46px] bg-white border-t border-b border-bolao-border flex items-center justify-center font-mono text-2xl font-medium">
                {homeScore}
              </div>
              <button
                onClick={() => setHomeScore(s => s + 1)}
                className="w-[38px] h-[46px] bg-bolao-bg border border-bolao-border rounded-r-lg flex items-center justify-center text-xl font-light active:bg-bolao-border transition-colors select-none"
              >+</button>
            </div>
          </div>

          <span className="font-display text-[26px] text-bolao-muted px-[6px]">–</span>

          {/* Visitante */}
          <div className="flex flex-col items-center gap-[5px]">
            <span className="text-[10px] text-bolao-muted font-semibold tracking-[0.06em] uppercase">
              {match.away?.name}
            </span>
            <div className="flex items-center">
              <button
                onClick={() => setAwayScore(s => Math.max(0, s - 1))}
                className="w-[38px] h-[46px] bg-bolao-bg border border-bolao-border rounded-l-lg flex items-center justify-center text-xl font-light active:bg-bolao-border transition-colors select-none"
              >−</button>
              <div className="w-[50px] h-[46px] bg-white border-t border-b border-bolao-border flex items-center justify-center font-mono text-2xl font-medium">
                {awayScore}
              </div>
              <button
                onClick={() => setAwayScore(s => s + 1)}
                className="w-[38px] h-[46px] bg-bolao-bg border border-bolao-border rounded-r-lg flex items-center justify-center text-xl font-light active:bg-bolao-border transition-colors select-none"
              >+</button>
            </div>
          </div>
        </div>

        <div className="px-5 mt-[18px]">
          <button
            onClick={handleSave}
            className="w-full h-[50px] bg-bolao-green text-white text-[15px] font-semibold rounded-xl tracking-wide active:opacity-80 transition-opacity"
          >
            Confirmar palpite
          </button>
        </div>
      </div>
    </div>
  );
}