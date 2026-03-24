import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalPalpite from '../components/ModalPalpite';

// "home" e "away" são os aliases do join Supabase — ModalPalpite usa este mesmo tipo
export type Match = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home: { name: string };
  away: { name: string };
  date: string;
  group_letter: string;
  round: number | null;
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
  const [filter, setFilter] = useState<Filter>('proximos');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isMatchLocked = (matchDate: string) => {
    if (!matchDate) return false;
    return currentTime >= new Date(matchDate).getTime() - 10 * 60 * 1000;
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateStr: string) => {
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
          *,
          home:teams!home_team_id(name),
          away:teams!away_team_id(name)
        `)
        .order('date', { ascending: true });

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
    if (isMatchLocked(match.date)) return;
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSavePick = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!user) return;
    const match = matches.find(m => m.id === matchId);
    if (match && isMatchLocked(match.date)) { alert('Tempo esgotado!'); return; }
    const { error } = await supabase
      .from('match_picks')
      .upsert({ user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
        { onConflict: 'user_id,match_id' });
    if (error) alert(error.message);
    else fetchData();
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'proximos') return isToday(m.date) || isUpcoming(m.date);
    if (filter === 'grupos') return !!m.group_letter;
    return true; // todos
  });

  const filterLabels: Record<Filter, string> = {
    proximos: `Hoje · ${matches.filter(m => isToday(m.date)).length} jogos`,
    grupos: `${matches.filter(m => m.group_letter).length} jogos`,
    todos: `${matches.length} jogos`,
  };

  const formatMatchTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(dateStr)) return `Hoje · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ` · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isLive = (dateStr: string) => {
    const start = new Date(dateStr).getTime();
    const now = currentTime;
    return now >= start && now <= start + 110 * 60 * 1000;
  };

  const liveMinute = (dateStr: string) => {
    return Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
  };

  if (loading) return (
    <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>
  );

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0 bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {filterLabels[filter]}
        </div>
      </div>

      {/* Filtros */}
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

      {/* Lista de jogos */}
      <div className="flex flex-col gap-[6px] px-5 pt-1">
        {filteredMatches.length === 0 && (
          <div className="text-center py-10 text-bolao-muted text-sm">
            Nenhum jogo encontrado.
          </div>
        )}

        {filteredMatches.map(match => {
          const pick = userPicks[match.id];
          const locked = isMatchLocked(match.date);
          const live = isLive(match.date);
          const finished = match.home_score !== null && match.away_score !== null;

          // badge de pontuação
          let ptsBadge = null;
          if (finished && pick) {
            if (pick.points > 3) {
              ptsBadge = <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-0.5 rounded-full">+{pick.points} pts · exato!</span>;
            } else if (pick.points > 0) {
              ptsBadge = <span className="text-[10px] font-bold bg-bolao-green-light text-bolao-green px-2 py-0.5 rounded-full">+{pick.points} pts</span>;
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
              {/* Topo */}
              <div className="flex justify-between items-center mb-[7px]">
                <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
                  {match.group_letter ? `Grupo ${match.group_letter}` : 'Mata-mata'}
                  {match.round ? ` · Rod. ${match.round}` : ''}
                </span>
                {live ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-bolao-red tracking-[0.07em]">
                    <span className="inline-block w-[5px] h-[5px] rounded-full bg-bolao-red animate-pulse" />
                    AO VIVO {liveMinute(match.date)}'
                  </span>
                ) : locked ? (
                  <span className="text-[10px] font-semibold text-bolao-red">🔒 Fechado</span>
                ) : (
                  <span className="text-[10px] text-bolao-muted font-mono">{formatMatchTime(match.date)}</span>
                )}
              </div>

              {/* Times */}
              <div className="flex items-center">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[19px]">⚽</span>
                  <span className="text-[13px] font-medium">{match.home?.name}</span>
                </div>
                <div className="w-[52px] text-center flex-shrink-0">
                  {finished ? (
                    <span className="font-mono text-[19px] font-medium">{match.home_score}·{match.away_score}</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-bolao-muted">VS</span>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2 flex-row-reverse">
                  <span className="text-[19px]">⚽</span>
                  <span className="text-[13px] font-medium">{match.away?.name}</span>
                </div>
              </div>

              {/* Rodapé */}
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