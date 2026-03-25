import { useState, useEffect } from 'react';
import type { Match } from '../types';

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
  const canSave = !showKnockoutOptions || (extraTimeWinner && penaltiesWinner);

  const handleConfirm = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const finalEtWinner = showKnockoutOptions ? extraTimeWinner : null;
    const finalPenWinner = showKnockoutOptions ? penaltiesWinner : null;
    await onSave(match.id, homeScore, awayScore, finalEtWinner, finalPenWinner);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 modal-overlay animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 z-50 modal-content p-6 animate-slide-up"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}>

        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '24px',
          letterSpacing: '1px',
          textAlign: 'center',
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {currentPick ? 'Editar Palpite' : 'Seu Palpite'}
        </h2>

        {/* Teams display */}
        <div className="flex items-center justify-center gap-6 mt-5 mb-6">
          <div className="text-center">
            {match.home?.flag_url ? (
              <img src={match.home.flag_url} alt={match.home.name}
                className="w-10 h-7 object-cover rounded mx-auto mb-1"
                style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
            ) : <span className="text-2xl">⚽</span>}
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
              {match.home?.name || match.home_team}
            </p>
          </div>

          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '18px',
            color: 'var(--muted)',
            letterSpacing: '2px',
          }}>VS</span>

          <div className="text-center">
            {match.away?.flag_url ? (
              <img src={match.away.flag_url} alt={match.away.name}
                className="w-10 h-7 object-cover rounded mx-auto mb-1"
                style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
            ) : <span className="text-2xl">⚽</span>}
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
              {match.away?.name || match.away_team}
            </p>
          </div>
        </div>

        {/* Score pickers */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
              {match.home?.name || match.home_team}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="score-btn">−</button>
              <span className="score-value">{homeScore}</span>
              <button onClick={() => setHomeScore(homeScore + 1)} className="score-btn">+</button>
            </div>
          </div>

          <span style={{
            fontSize: '20px',
            color: 'var(--border)',
            fontWeight: 300,
            margin: '0 4px',
            paddingTop: '20px',
          }}>—</span>

          <div className="text-center">
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
              {match.away?.name || match.away_team}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="score-btn">−</button>
              <span className="score-value">{awayScore}</span>
              <button onClick={() => setAwayScore(awayScore + 1)} className="score-btn">+</button>
            </div>
          </div>
        </div>

        {/* Knockout options */}
        {showKnockoutOptions && (
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}>Palpites extras mata-mata</h3>

            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              Em caso de prorrogação, quem avança?
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: match.home_team, label: match.home?.name || match.home_team },
                { value: match.away_team, label: match.away?.name || match.away_team },
                { value: 'empate', label: 'Empate (pênaltis)' },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => setExtraTimeWinner(opt.value)}
                  className="py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: extraTimeWinner === opt.value ? 'var(--green-light)' : 'var(--bg)',
                    color: extraTimeWinner === opt.value ? 'var(--green)' : 'var(--text)',
                    border: `1px solid ${extraTimeWinner === opt.value ? 'var(--green-mid)' : 'var(--border)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              E se for para os pênaltis?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: match.home_team, label: match.home?.name || match.home_team },
                { value: match.away_team, label: match.away?.name || match.away_team },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => setPenaltiesWinner(opt.value)}
                  className="py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: penaltiesWinner === opt.value ? 'var(--green)' : 'var(--bg)',
                    color: penaltiesWinner === opt.value ? '#fff' : 'var(--text)',
                    border: `1px solid ${penaltiesWinner === opt.value ? 'var(--green)' : 'var(--border)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isSaving || !canSave}
          className="w-full mt-6 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
          style={{
            background: canSave ? 'var(--gradient-hero)' : 'var(--bg3)',
            color: canSave ? '#fff' : 'var(--muted)',
            boxShadow: canSave ? 'var(--shadow-hero)' : 'none',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? 'Salvando...' : 'Confirmar palpite'}
        </button>
      </div>
    </>
  );
}
