import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalPalpite from '../components/ModalPalpite';

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home: { name: string, group_name: string, flag_url: string };
  away: { name: string, group_name: string, flag_url: string };
  match_date: string;
  stage: string;
  home_score: number | null;
  away_score: number | null;
};

type Pick = {
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
};

type Filter = 'proximos' | 'grupos' | 'todos';

export default function Jogos() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [filter, setFilter] = useState<Filter>('todos');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isMatchLocked = (matchDate: string) => {
    if (!matchDate) return false;
    return currentTime >= new Date(matchDate).getTime() - 10 * 60 * 1000;
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    return d >= new Date() && d <= threeDays;
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id, match_date, stage, home_score, away_score, home_team, away_team,
          home:teams!matches_home_team_fkey(name, group_name, flag_url),
          away:teams!matches_away_team_fkey(name, group_name, flag_url)
        `)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;
      if (matchesData) setMatches(matchesData as unknown as Match[]);

      const { data: picksData } = await supabase
        .from('match_picks')
        .select('*')
        .eq('user_id', user.id);

      if (picksData) {
        const picksMap: Record<string, Pick> = {};
        picksData.forEach(pick => { picksMap[pick.match_id] = pick; });
        setUserPicks(picksMap);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (match: Match) => {
    if (isMatchLocked(match.match_date)) return;
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSavePick = async (matchId: string, homeScore: number, awayScore: number, extraTimeWinner: string | null, penaltiesWinner: string | null) => {
    if (!user) return;
    const match = matches.find(m => m.id === matchId);
    if (match && isMatchLocked(match.match_date)) { alert('Tempo esgotado!'); return; }
    
    const { error } = await supabase
      .from('match_picks')
      .upsert({ 
        user_id: user.id, 
        match_id: matchId, 
        home_score: homeScore, 
        away_score: awayScore,
        extra_time_winner: extraTimeWinner,
        penalties_winner: penaltiesWinner
      }, { onConflict: 'user_id,match_id' });
        
    if (error) alert(error.message);
    else fetchData();
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'proximos') return isToday(m.match_date) || isUpcoming(m.match_date);
    if (filter === 'grupos') return m.home?.group_name;
    return true; 
  });

  const filterLabels: Record<Filter, string> = {
    proximos: `Hoje · ${matches.filter(m => isToday(m.match_date)).length} jogos`,
    grupos: `${matches.filter(m => m.home?.group_name).length} jogos`,
    todos: `${matches.length} jogos`,
  };

  const formatMatchTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isToday(dateStr)) return `Hoje · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ` · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isLive = (dateStr: string) => {
    if (!dateStr) return false;
    const start = new Date(dateStr).getTime();
    const now = currentTime;
    return now >= start && now <= start + 110 * 60 * 1000;
  };

  const liveMinute = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
  };

  if (loading) return (
    <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>
  );

  return (
    <div className="flex flex-col pb-20">
      <div className="flex items-center justify-between px-5 pt-5 pb-0 bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {filterLabels[filter]}
        </div>
      </div>

      <div className="flex gap-[6px] px-5 pt-[10px] pb-[6px] overflow-x-auto">
        {(['proximos', 'grupos', 'todos'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-[13px] py-[6px] rounded-full text-[11px] font-semibold border transition-all ${
              filter === f
                ? 'bg-bolao-green-light border-bolao-green-mid text-bolao-green'
                : 'bg-bolao-bg-card border-bolao-border text-bolao-muted'
            }`}
          >
            {f === 'proximos' ? 'Próximos' : f === 'grupos' ? 'Grupos' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[6px] px-5 pt-1">
        {filteredMatches.length === 0 && (
          <div className="text-center py-10 text-bolao-muted text-sm">
            Nenhum jogo encontrado.
          </div>
        )}

        {filteredMatches.map(match => {
          const pick = userPicks[match.id];
          const locked = isMatchLocked(match.match_date);
          const live = isLive(match.match_date);
          const finished = match.home_score !== null && match.away_score !== null;

          let ptsBadge = null;
          if (finished && pick) {
            if (pick.points === 8) {
              ptsBadge = <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-0.5 rounded-full">+8 pts · exato!</span>;
            } else if (pick.points === 3) {
              ptsBadge = <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-0.5 rounded-full">+3 pts</span>;
            } else {
              ptsBadge = <span className="text-[10px] font-bold bg-bolao-red-light text-bolao-red px-2 py-0.5 rounded-full">0 pts</span>;
            }
          } else if (!finished && pick) {
            ptsBadge = <span className="text-[10px] font-bold bg-bolao-bg border border-bolao-border text-bolao-muted px-2 py-0.5 rounded-full">Aguardando</span>;
          }

          return (
            <div
              key={match.id}
              onClick={() => openModal(match)}
              className={`bg-bolao-bg-card border rounded-[9px] px-3 py-[9px] transition-colors ${
                pick ? 'border-l-[3px] border-bolao-green-mid' : 'border-bolao-border'
              } ${locked ? 'opacity-70' : 'cursor-pointer active:bg-gray-50'}`}
            >
              <div className="flex justify-between items-center mb-[7px]">
                <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
                  {match.home?.group_name ? `Grupo ${match.home.group_name}` : 'Mata-mata'}
                </span>
                {live ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-bolao-red tracking-[0.07em]">
                    <span className="inline-block w-[5px] h-[5px] rounded-full bg-bolao-red animate-pulse" />
                    AO VIVO {liveMinute(match.match_date)}'
                  </span>
                ) : locked ? (
                  <span className="text-[10px] font-semibold text-bolao-red">🔒 Fechado</span>
                ) : (
                  <span className="text-[10px] text-bolao-muted font-mono">{formatMatchTime(match.match_date)}</span>
                )}
              </div>

              <div className="flex items-center">
                <div className="flex-1 flex items-center justify-end gap-2 pr-4">
                  <span className="text-[13px] font-medium text-right">{match.home?.name || match.home_team}</span>
                  {match.home?.flag_url ? (
                    <img src={match.home.flag_url} alt={match.home.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border" />
                  ) : (
                    <span className="text-[19px]">⚽</span>
                  )}
                </div>
                
                <div className="w-[52px] text-center flex-shrink-0 bg-bolao-bg rounded p-1 border border-bolao-border">
                  {finished ? (
                    <span className="font-mono text-[16px] font-bold text-bolao-text">{match.home_score} <span className="text-bolao-muted text-[10px] mx-0.5">X</span> {match.away_score}</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-bolao-muted block py-1">VS</span>
                  )}
                </div>
                
                <div className="flex-1 flex items-center gap-2 pl-4">
                  {match.away?.flag_url ? (
                    <img src={match.away.flag_url} alt={match.away.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border" />
                  ) : (
                    <span className="text-[19px]">⚽</span>
                  )}
                  <span className="text-[13px] font-medium text-left">{match.away?.name || match.away_team}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-[7px] pt-[6px] border-t border-bolao-border">
                {pick ? (
                  <span className="text-[11px] text-bolao-muted">
                    Palpite: <strong className="text-bolao-text font-mono">{pick.home_score}–{pick.away_score}</strong>
                  </span>
                ) : locked ? (
                  <span className="text-[11px] text-bolao-red font-medium">Sem palpite</span>
                ) : (
                  <span className="text-[11px] text-bolao-green font-semibold">Palpitar agora →</span>
                )}
                {ptsBadge ?? <span className="text-[10px] text-bolao-muted">—</span>}
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