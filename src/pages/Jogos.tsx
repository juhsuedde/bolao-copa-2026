import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ModalPalpite from '../components/ModalPalpite';
import { useAuth } from '../hooks/useAuth';

// Tipagem básica
type Match = {
  id: string;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  locked: boolean;
  home_team: { name: string; group_letter: string; id?: string };
  away_team: { name: string; group_letter: string; id?: string };
};

type Pick = {
  home_score: number;
  away_score: number;
};

export default function Jogos() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar o modal
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função central para buscar jogos e palpites do utilizador
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Busca todos os jogos
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(name, group_letter),
        away_team:away_team_id(name, group_letter)
      `)
      .order('kickoff_at', { ascending: true });
      
    if (matchesData && !matchesError) {
      setMatches(matchesData as Match[]);
    } else {
      console.error("Erro ao buscar jogos:", matchesError);
    }

    // 2. Busca os palpites do utilizador logado
    if (user) {
      const { data: picksData, error: picksError } = await supabase
        .from('match_picks')
        .select('match_id, home_score, away_score')
        .eq('user_id', user.id);

      if (picksData && !picksError) {
        // Transforma o array num objecto (dicionário) para facilitar a busca pelo ID do jogo
        const picksMap: Record<string, Pick> = {};
        picksData.forEach(pick => {
          picksMap[pick.match_id] = { home_score: pick.home_score, away_score: pick.away_score };
        });
        setUserPicks(picksMap);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openModal = (match: Match) => {
    if (!match.locked) {
      setSelectedMatch(match);
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return <div className="p-6 text-bolao-muted flex justify-center mt-10">A carregar jogos...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-5 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {matches.length} jogos
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {matches.map(match => {
          const pick = userPicks[match.id];
          const isPicked = !!pick;

          // Construção das classes dinâmicas do card
          let cardClasses = "bg-bolao-bg-card p-4 rounded-xl border transition-colors flex flex-col ";
          if (match.locked) {
            cardClasses += "opacity-70 border-bolao-border cursor-not-allowed";
          } else {
            cardClasses += "active:bg-bolao-bg cursor-pointer ";
            if (isPicked) {
              cardClasses += "border-bolao-border border-l-[4px] border-l-bolao-green-mid";
            } else {
              cardClasses += "border-bolao-border";
            }
          }

          return (
            <div key={match.id} onClick={() => openModal(match)} className={cardClasses}>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-semibold text-bolao-muted tracking-wider uppercase">
                  Grupo {match.home_team.group_letter}
                </span>
                {match.locked && (
                  <span className="text-[10px] font-bold text-bolao-red tracking-wider flex items-center gap-1">
                    🔒 Fechado
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-center">{match.home_team.name}</span>
                </div>
                
                <div className="w-16 flex justify-center">
                  {match.home_score !== null && match.away_score !== null ? (
                    <span className="font-mono text-xl font-medium">
                      {match.home_score}·{match.away_score}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-bolao-muted">VS</span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-center">{match.away_team.name}</span>
                </div>
              </div>

              {/* Rodapé dinâmico dependendo do estado do palpite */}
              <div className="flex items-center justify-between pt-3 border-t border-bolao-border mt-3">
                {isPicked ? (
                  <span className="text-[11px] text-bolao-muted">
                    Palpite: <strong className="text-bolao-text font-mono text-xs ml-1">{pick.home_score}–{pick.away_score}</strong>
                  </span>
                ) : match.locked ? (
                  <span className="text-[11px] text-bolao-red font-medium">Sem palpite</span>
                ) : (
                  <span className="text-[11px] text-bolao-green font-semibold">Palpitar agora →</span>
                )}
                
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bolao-bg text-bolao-muted">
                  {match.locked ? '—' : 'Aberto'}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      <ModalPalpite 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        match={selectedMatch}
        onSaveSuccess={fetchData} // Ao gravar com sucesso, actualiza a lista de palpites
      />
    </div>
  );
}