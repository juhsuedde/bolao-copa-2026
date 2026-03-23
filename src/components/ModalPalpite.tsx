import { useState, useEffect } from 'react';

// Tipagem exata do que o Jogos.tsx envia para cá
type Match = {
  id: string;
  home_team: { name: string; flag_url?: string };
  away_team: { name: string; flag_url?: string };
};

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
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  // Preenche os inputs se o usuário já tiver um palpite salvo
  useEffect(() => {
    if (isOpen) {
      setHomeScore(currentPick ? String(currentPick.home_score) : '');
      setAwayScore(currentPick ? String(currentPick.away_score) : '');
    }
  }, [isOpen, currentPick]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (homeScore === '' || awayScore === '') {
      alert('Preencha os dois placares!');
      return;
    }
    // Converte os textos para números antes de salvar
    onSave(match.id, parseInt(homeScore), parseInt(awayScore));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col justify-end z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-bolao-bg-card rounded-t-[24px] border border-bolao-border border-b-0 pb-8 animate-in slide-in-from-bottom duration-300 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-bolao-border rounded-full mt-3 mb-6 shrink-0"></div>
        
        <h2 className="font-display text-xl tracking-wide text-bolao-text mb-6">Seu Palpite</h2>

        <div className="flex items-center justify-center gap-6 w-full px-8 mb-8">
          {/* Time da Casa */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-medium text-bolao-text mb-3 text-center">
              {match.home_team?.name || 'A definir'}
            </span>
            <input 
              type="number" 
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-16 h-16 text-center text-3xl font-display bg-bolao-bg border border-bolao-border rounded-xl focus:outline-none focus:border-bolao-green"
            />
          </div>

          <span className="text-xl font-bold text-bolao-muted mt-8">X</span>

          {/* Time Visitante */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-medium text-bolao-text mb-3 text-center">
              {match.away_team?.name || 'A definir'}
            </span>
            <input 
              type="number" 
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-16 h-16 text-center text-3xl font-display bg-bolao-bg border border-bolao-border rounded-xl focus:outline-none focus:border-bolao-green"
            />
          </div>
        </div>

        <div className="w-full px-5">
          <button 
            onClick={handleSave}
            className="w-full h-14 bg-bolao-green text-white text-[15px] font-semibold rounded-xl tracking-wide active:opacity-80 transition-opacity"
          >
            Confirmar Palpite
          </button>
        </div>
      </div>
    </div>
  );
}