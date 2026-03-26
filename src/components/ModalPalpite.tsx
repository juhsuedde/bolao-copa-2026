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

const LAYER_INFO = {
  group: {
    exact: 8,
    winner: 3,
  },
  knockout: {
    exact: 10,
    winner: 4,
    extraTime: 5,
    penalties: 5,
  },
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
  const info = isKnockout ? LAYER_INFO.knockout : LAYER_INFO.group;

  // Para mata-mata, os palpites extras são obrigatórios
  const canSave = !isKnockout || (extraTimeWinner !== null && penaltiesWinner !== null);

  const homeName = match.home?.name || match.home_team;
  const awayName = match.away?.name || match.away_team;

  const handleConfirm = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const finalEtWinner = isKnockout ? extraTimeWinner : null;
    const finalPenWinner = isKnockout ? penaltiesWinner : null;
    await onSave(match.id, homeScore, awayScore, finalEtWinner, finalPenWinner);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] modal-overlay animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-x-4 bottom-4 z-[100] modal-content p-6 animate-slide-up"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Título */}
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '22px',
          letterSpacing: '1px',
          textAlign: 'center',
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '4px',
        }}>
          {currentPick ? 'Editar Palpite' : 'Seu Palpite'}
        </h2>

        {/* Badge da fase */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', marginBottom: '16px' }}>
          {isKnockout ? '⚡ Mata-mata' : '🏟️ Fase de grupos'}
        </p>

        {/* Times */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <div className="text-center flex-1">
            {match.home?.flag_url ? (
              <img src={match.home.flag_url} alt={homeName}
                className="w-10 h-7 object-cover rounded mx-auto mb-1"
                style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
            ) : <span className="text-2xl">⚽</span>}
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{homeName}</p>
          </div>

          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '18px',
            color: 'var(--muted)',
            letterSpacing: '2px',
          }}>VS</span>

          <div className="text-center flex-1">
            {match.away?.flag_url ? (
              <img src={match.away.flag_url} alt={awayName}
                className="w-10 h-7 object-cover rounded mx-auto mb-1"
                style={{ border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
            ) : <span className="text-2xl">⚽</span>}
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{awayName}</p>
          </div>
        </div>

        {/* ── CAMADA 1: Placar no tempo normal ── */}
        <div className="p-4 rounded-2xl mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {isKnockout ? '① Placar no tempo normal' : 'Placar final'}
            </p>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              background: 'var(--green-light)', color: 'var(--green)',
              border: '1px solid var(--green-mid)',
              padding: '2px 8px', borderRadius: '12px',
            }}>
              {info.exact} pts exato · {'winner' in info ? info.winner : ''} pts vencedor
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>{homeName}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="score-btn">−</button>
                <span className="score-value">{homeScore}</span>
                <button onClick={() => setHomeScore(homeScore + 1)} className="score-btn">+</button>
              </div>
            </div>

            <span style={{ fontSize: '20px', color: 'var(--border)', fontWeight: 300, paddingTop: '20px' }}>—</span>

            <div className="text-center">
              <p style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>{awayName}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="score-btn">−</button>
                <span className="score-value">{awayScore}</span>
                <button onClick={() => setAwayScore(awayScore + 1)} className="score-btn">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CAMADAS 2 e 3: Só para mata-mata ── */}
        {isKnockout && (
          <>
            {/* Camada 2: Prorrogação */}
            <div className="p-4 rounded-2xl mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    ② Se for pra prorrogação
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                    Só pontua se o jogo for pra prorrogação
                  </p>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  background: 'var(--gold-light)', color: 'var(--gold)',
                  border: '1px solid var(--gold-border)',
                  padding: '2px 8px', borderRadius: '12px',
                  flexShrink: 0,
                }}>
                  +5 pts
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: match.home_team, label: homeName },
                  { value: 'empate', label: '→ Pênaltis' },
                  { value: match.away_team, label: awayName },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setExtraTimeWinner(opt.value)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: extraTimeWinner === opt.value ? 'var(--green-light)' : 'var(--bg2)',
                      color: extraTimeWinner === opt.value ? 'var(--green)' : 'var(--text)',
                      border: `1px solid ${extraTimeWinner === opt.value ? 'var(--green-mid)' : 'var(--border)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Camada 3: Pênaltis */}
            <div className="p-4 rounded-2xl mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    ③ Se for pra pênaltis
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                    Só pontua se o jogo for pra pênaltis
                  </p>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  background: 'var(--gold-light)', color: 'var(--gold)',
                  border: '1px solid var(--gold-border)',
                  padding: '2px 8px', borderRadius: '12px',
                  flexShrink: 0,
                }}>
                  +5 pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: match.home_team, label: homeName },
                  { value: match.away_team, label: awayName },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPenaltiesWinner(opt.value)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: penaltiesWinner === opt.value ? 'var(--green)' : 'var(--bg2)',
                      color: penaltiesWinner === opt.value ? '#fff' : 'var(--text)',
                      border: `1px solid ${penaltiesWinner === opt.value ? 'var(--green)' : 'var(--border)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso se não preencheu */}
            {(!extraTimeWinner || !penaltiesWinner) && (
              <p style={{ fontSize: '11px', color: 'var(--gold)', textAlign: 'center', marginBottom: '8px' }}>
                ⚠️ Preencha os palpites extras para confirmar
              </p>
            )}
          </>
        )}

        {/* Botão confirmar */}
        <button
          onClick={handleConfirm}
          disabled={isSaving || !canSave}
          className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
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