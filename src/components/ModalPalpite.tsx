import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type Match = {
  id: string;
  home_team: { name: string; group_letter: string; id?: string };
  away_team: { name: string; group_letter: string; id?: string };
};

interface ModalPalpiteProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSaveSuccess?: () => void; // Callback para recarregar a lista após salvar
}

export default function ModalPalpite({ isOpen, onClose, match, onSaveSuccess }: ModalPalpiteProps) {
  const { user } = useAuth();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [pickId, setPickId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Busca um palpite existente sempre que o modal abrir
  useEffect(() => {
    async function fetchExistingPick() {
      if (isOpen && match && user) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('match_picks')
          .select('id, home_score, away_score')
          .eq('user_id', user.id)
          .eq('match_id', match.id)
          .maybeSingle();

        if (data && !error) {
          setHomeScore(data.home_score);
          setAwayScore(data.away_score);
          setPickId(data.id);
        } else {
          setHomeScore(0);
          setAwayScore(0);
          setPickId(null);
        }
        setIsLoading(false);
      }
    }
    fetchExistingPick();
  }, [isOpen, match, user]);

  if (!isOpen || !match) return null;

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const pickData = {
      user_id: user.id,
      match_id: match.id,
      home_score: homeScore,
      away_score: awayScore,
    };

    if (pickId) {
      // Atualiza palpite existente
      await supabase.from('match_picks').update(pickData).eq('id', pickId);
    } else {
      // Insere novo palpite
      await supabase.from('match_picks').insert([pickData]);
    }

    setIsLoading(false);
    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col justify-end z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-bolao-bg-card rounded-t-[24px] border border-bolao-border border-b-0 pb-8 animate-in slide-in-from-bottom duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-bolao-border rounded-full mx-auto mt-3 mb-4"></div>
        <h2 className="font-display text-xl tracking-wide px-5 text-bolao-text">Seu palpite</h2>
        
        <div className="mx-5 my-3 flex items-center bg-bolao-bg border border-bolao-border rounded-xl p-3.5">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold">{match.home_team.name}</span>
          </div>
          <div className="w-10 text-center text-bolao-muted font-display text-lg">VS</div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold">{match.away_team.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 px-5 py-1">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-bolao-muted font-semibold tracking-wider uppercase">
              {match.home_team.name}
            </span>
            <div className="flex items-center">
              <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="w-10 h-11 bg-bolao-bg border border-bolao-border rounded-l-lg text-xl font-light active:bg-gray-100 flex items-center justify-center">−</button>
              <div className="w-12 h-11 bg-bolao-bg-card border-y border-bolao-border flex items-center justify-center font-mono text-2xl font-medium">
                {homeScore}
              </div>
              <button onClick={() => setHomeScore(homeScore + 1)} className="w-10 h-11 bg-bolao-bg border border-bolao-border rounded-r-lg text-xl font-light active:bg-gray-100 flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="font-display text-2xl text-bolao-muted px-1">–</div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-bolao-muted font-semibold tracking-wider uppercase">
              {match.away_team.name}
            </span>
            <div className="flex items-center">
              <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="w-10 h-11 bg-bolao-bg border border-bolao-border rounded-l-lg text-xl font-light active:bg-gray-100 flex items-center justify-center">−</button>
              <div className="w-12 h-11 bg-bolao-bg-card border-y border-bolao-border flex items-center justify-center font-mono text-2xl font-medium">
                {awayScore}
              </div>
              <button onClick={() => setAwayScore(awayScore + 1)} className="w-10 h-11 bg-bolao-bg border border-bolao-border rounded-r-lg text-xl font-light active:bg-gray-100 flex items-center justify-center">+</button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isLoading}
          className={`mx-5 mt-5 w-[calc(100%-40px)] h-12 bg-bolao-green text-white text-[15px] font-semibold rounded-xl tracking-wide transition-opacity flex justify-center items-center ${isLoading ? 'opacity-50' : 'active:opacity-80'}`}
        >
          {isLoading ? 'Carregando...' : 'Confirmar palpite'}
        </button>
      </div>
    </div>
  );
}