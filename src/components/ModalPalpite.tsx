import { useState, useEffect } from 'react';
import type { Match } from '../pages/Jogos';

type ModalPalpiteProps = {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  currentPick: { 
    home_score: number; 
    away_score: number;
    extra_time_winner?: string | null;
    penalties_winner?: string | null;
  } | null;
  onSave: (matchId: string, home: number, away: number, extraTimeWinner: string | null, penaltiesWinner: string | null) => void;
};

export default function ModalPalpite({ isOpen, onClose, match, currentPick, onSave }: ModalPalpiteProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [extraTimeWinner, setExtraTimeWinner] = useState<string | null>(null);
  const [penaltiesWinner, setPenaltiesWinner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentPick) {
        setHomeScore(currentPick.home_score);
        setAwayScore(currentPick.away_score);
        setExtraTimeWinner(currentPick.extra_time_winner || null);
        setPenaltiesWinner(currentPick.penalties_winner || null);
      } else {
        setHomeScore(0);
        setAwayScore(0);
        setExtraTimeWinner(null);
        setPenaltiesWinner(null);
      }
    }
  }, [isOpen, currentPick]);

  if (!isOpen || !match) return null;

  const isKnockout = match.stage !== 'group_stage';
  const showKnockoutOptions = isKnockout; 
  
  // A trava agora exige que as DUAS opções estejam preenchidas no mata-mata
  const canSave = !showKnockoutOptions || (extraTimeWinner && penaltiesWinner);

  const handleConfirm = async () => {
    if (!canSave) return;
    setIsSaving(true);
    
    // Agora enviamos os dois valores independentemente do que foi escolhido
    const finalEtWinner = showKnockoutOptions ? extraTimeWinner : null;
    const finalPenWinner = showKnockoutOptions ? penaltiesWinner : null;

    await onSave(match.id, homeScore, awayScore, finalEtWinner, finalPenWinner);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-bolao-text/60 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform">
        <div className="bg-bolao-bg rounded-t-3xl pt-2 px-5 pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          
          <div className="w-12 h-1 bg-bolao-border rounded-full mx-auto mb-6 opacity-60" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-bolao-text">
              {currentPick ? 'Editar Palpite' : 'Seu Palpite'}
            </h2>
            <button onClick={onClose} className="p-2 -mr-2 text-bolao-muted hover:text-bolao-text">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center">
                {match.home?.flag_url ? (
                  <img src={match.home.flag_url} alt={match.home.name} className="w-10 h-7 object-cover rounded shadow-sm border border-bolao-border mb-3" />
                ) : (
                  <span className="text-3xl mb-3">⚽</span>
                )}
                <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                  {match.home?.name || match.home_team}
                </span>
              </div>

              <div className="text-[10px] font-semibold text-bolao-muted">VS</div>

              <div className="flex-1 flex flex-col items-center">
                {match.away?.flag_url ? (
                  <img src={match.away.flag_url} alt={match.away.name} className="w-10 h-7 object-cover rounded shadow-sm border border-bolao-border mb-3" />
                ) : (
                  <span className="text-3xl mb-3">⚽</span>
                )}
                <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                  {match.away?.name || match.away_team}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-widest text-bolao-muted font-bold mb-2 truncate w-full text-center">
                  {match.home?.name || match.home_team}
                </span>
                <div className="flex items-center bg-bolao-bg border border-bolao-border rounded-xl p-1 shadow-inner">
                  <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="w-10 h-10 flex items-center justify-center text-bolao-muted hover:text-bolao-text active:bg-gray-100 rounded-lg">
                    <span className="text-lg font-mono">-</span>
                  </button>
                  <div className="w-12 text-center font-display text-3xl pb-1">{homeScore}</div>
                  <button onClick={() => setHomeScore(homeScore + 1)} className="w-10 h-10 flex items-center justify-center text-bolao-muted hover:text-bolao-text active:bg-gray-100 rounded-lg">
                    <span className="text-lg font-mono">+</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end pb-3 text-bolao-border">
                <span className="font-mono text-2xl">—</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-widest text-bolao-muted font-bold mb-2 truncate w-full text-center">
                  {match.away?.name || match.away_team}
                </span>
                <div className="flex items-center bg-bolao-bg border border-bolao-border rounded-xl p-1 shadow-inner">
                  <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="w-10 h-10 flex items-center justify-center text-bolao-muted hover:text-bolao-text active:bg-gray-100 rounded-lg">
                    <span className="text-lg font-mono">-</span>
                  </button>
                  <div className="w-12 text-center font-display text-3xl pb-1">{awayScore}</div>
                  <button onClick={() => setAwayScore(awayScore + 1)} className="w-10 h-10 flex items-center justify-center text-bolao-muted hover:text-bolao-text active:bg-gray-100 rounded-lg">
                    <span className="text-lg font-mono">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showKnockoutOptions && (
            <div className="mb-6 animate-fade-in flex flex-col gap-4">
              
              <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl p-5">
                <div className="text-center mb-4">
                  <h3 className="text-[11px] font-bold text-bolao-text uppercase tracking-widest mb-1">
                    Palpites extras mata-mata
                  </h3>
                  <p className="text-[10px] text-bolao-muted">
                    Em caso de prorrogação, quem avança?
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setExtraTimeWinner(match.home_team)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${extraTimeWinner === match.home_team ? 'bg-bolao-green-light border-bolao-green-mid text-bolao-green' : 'bg-bolao-bg border-bolao-border text-bolao-text'}`}
                  >
                    {match.home?.name || match.home_team}
                  </button>
                  <button 
                    onClick={() => setExtraTimeWinner(match.away_team)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${extraTimeWinner === match.away_team ? 'bg-bolao-green-light border-bolao-green-mid text-bolao-green' : 'bg-bolao-bg border-bolao-border text-bolao-text'}`}
                  >
                    {match.away?.name || match.away_team}
                  </button>
                  <button 
                    onClick={() => setExtraTimeWinner('empate')}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${extraTimeWinner === 'empate' ? 'bg-bolao-green-light border-bolao-green-mid text-bolao-green' : 'bg-bolao-bg border-bolao-border text-bolao-text'}`}
                  >
                    Empate (pênaltis)
                  </button>
                </div>
              </div>

              <div className="bg-bolao-bg-card border border-bolao-border rounded-2xl p-5">
                <div className="text-center mb-4">                  
                  <p className="text-[10px] text-bolao-muted">
                    E se for para os pênaltis?
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPenaltiesWinner(match.home_team)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${penaltiesWinner === match.home_team ? 'bg-bolao-green border-bolao-green text-white' : 'bg-bolao-bg border-bolao-border text-bolao-text'}`}
                  >
                    {match.home?.name || match.home_team}
                  </button>
                  <button 
                    onClick={() => setPenaltiesWinner(match.away_team)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${penaltiesWinner === match.away_team ? 'bg-bolao-green border-bolao-green text-white' : 'bg-bolao-bg border-bolao-border text-bolao-text'}`}
                  >
                    {match.away?.name || match.away_team}
                  </button>
                </div>
              </div>

            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={isSaving || !canSave}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-sm ${
              isSaving || !canSave
                ? 'bg-bolao-green-mid/50 text-white/70 cursor-not-allowed' 
                : 'bg-bolao-green text-white hover:bg-bolao-green-mid active:bg-bolao-green-dark'
            }`}
          >
            {isSaving ? 'Salvando...' : 'Confirmar palpite'}
          </button>
        </div>
      </div>
    </>
  );
}