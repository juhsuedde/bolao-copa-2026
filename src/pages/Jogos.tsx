import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalPalpite from '../components/ModalPalpite'; 

type Match = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home: { name: string };
  away: { name: string };
  date: string;
  group_letter: string;
  home_score: number | null;
  away_score: number | null;
};

type Pick = {
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
};

export default function Jogos() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isMatchLocked = (matchDate: string) => {
    if (!matchDate) return false;
    const matchTime = new Date(matchDate).getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    return currentTime >= (matchTime - tenMinutesInMs);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Busca simplificada sem joins complexos primeiro para testar
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          home:teams!home_team_id(name),
          away:teams!away_team_id(name)
        `)
        .order('date', { ascending: true });

      if (matchesError) throw matchesError;
      if (matchesData) setMatches(matchesData as any);

      const { data: picksData } = await supabase
        .from('match_picks')
        .select('*')
        .eq('user_id', user.id);

      if (picksData) {
        const picksMap: Record<string, Pick> = {};
        picksData.forEach(pick => {
          picksMap[pick.match_id] = pick;
        });
        setUserPicks(picksMap);
      }
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (match: Match) => {
    if (isMatchLocked(match.date)) return; 
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSavePick = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!user) return;
    
    const match = matches.find(m => m.id === matchId);
    if (match && isMatchLocked(match.date)) {
      alert("Tempo esgotado!");
      return;
    }

    const { error } = await supabase
      .from('match_picks')
      .upsert({
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore
      }, { onConflict: 'user_id,match_id' });

    if (error) {
      alert(error.message);
    } else {
      fetchData();
    }
  };

  if (loading) {
    return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-center justify-between px-5 pt-5 bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide uppercase">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {matches.length} jogos
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {matches.map(match => {
          const pick = userPicks[match.id];
          const isLocked = isMatchLocked(match.date);

          return (
            <div 
              key={match.id} 
              onClick={() => openModal(match)}
              className={`bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden shadow-sm flex flex-col ${isLocked ? 'opacity-80' : 'cursor-pointer active:bg-gray-50'}`}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="text-[10px] font-semibold text-bolao-muted tracking-widest uppercase">
                  Grupo {match.group_letter}
                </div>
                
                {isLocked ? (
                  <div className="text-[10px] font-bold text-bolao-red bg-bolao-red-light px-2 py-0.5 rounded flex items-center gap-1">
                    🔒 Fechado
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-bolao-green bg-bolao-green-light px-2 py-0.5 rounded">
                    Aberto
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 text-right text-sm font-medium text-bolao-text">
                  {match.home?.name}
                </div>
                
                <div className="w-20 text-center font-display text-lg tracking-widest text-bolao-text">
                  {match.home_score !== null && match.away_score !== null 
                    ? `${match.home_score} - ${match.away_score}` 
                    : 'VS'}
                </div>

                <div className="flex-1 text-left text-sm font-medium text-bolao-text">
                  {match.away?.name}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                {pick ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-[11px] text-bolao-text font-medium">
                      Palpite: <strong className="font-bold">{pick.home_score} - {pick.away_score}</strong>
                    </span>
                    {isLocked && pick.points > 0 && (
                      <span className="text-[11px] font-bold text-bolao-green bg-bolao-green-light px-2 py-0.5 rounded-full">
                        +{pick.points} pts
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-bolao-red font-medium">Sem palpite</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedMatch && (
        <ModalPalpite 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          match={selectedMatch}
          currentPick={userPicks[selectedMatch.id] || null}
          onSave={handleSavePick}
        />
      )}
    </div>
  );
}