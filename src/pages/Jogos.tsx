import { useState, useRef, useEffect, useMemo } from 'react';
import { useMatches } from '../hooks/useMatches';
import { useToast } from '../hooks/useToast';
import ModalPalpite from '../components/ModalPalpite';
import ModalResultadoJogo from '../components/ModalResultadoJogo';
import MatchCard from '../components/MatchCard';
import MatchFilters from '../components/MatchFilters';
import MatchDayGroup from '../components/MatchDayGroup';
import type { Match, Filter, GroupFilter } from '../types';
import { FIRST_MATCH_DATE } from '../types';

function groupByDay(matches: Match[]): { label: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    if (!m.match_date) continue;
    const d = new Date(m.match_date);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const key = isToday
      ? 'Hoje'
      : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, matches]) => ({ label, matches }));
}

export default function Jogos() {
  const {
    matches,
    userPicks,
    loading,
    isMatchLocked,
    isToday,
    isFirstMatchDay,
    isLive,
    liveMinute,
    formatTime,
    savePick,
    isGroupStageOver,
    filterMatches,
  } = useMatches();

  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<Filter>(() => {
    const now = new Date();
    const firstMatchDay = new Date(FIRST_MATCH_DATE);
    firstMatchDay.setHours(0, 0, 0, 0);
    return now < firstMatchDay ? 'proximos' : 'hoje';
  });
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('A');
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const now = new Date();
  const firstMatchDay = new Date(FIRST_MATCH_DATE);
  firstMatchDay.setHours(0, 0, 0, 0);
  const isBeforeFirstDay = now < firstMatchDay;

  const availableFilters: Filter[] = (() => {
    if (isGroupStageOver) return ['hoje', 'todos'];
    if (isBeforeFirstDay) return ['proximos', 'grupos', 'todos'];
    return ['hoje', 'grupos', 'todos'];
  })();

  useEffect(() => {
    if (isGroupStageOver && filter === 'grupos') {
      setFilter('hoje');
      setGroupFilter(null);
    }
  }, [isGroupStageOver]);

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    if (newFilter === 'grupos') setGroupFilter('A');
    else setGroupFilter(null);
  };

  const filteredMatches = filterMatches(filter, groupFilter);
  const matchesByDay = useMemo(
    () => filter === 'todos' ? groupByDay(matches) : [],
    [filter, matches]
  );

  const { todayCount, proximosCount, groupCount } = {
    todayCount: matches.filter(m => isToday(m.match_date)).length,
    proximosCount: matches.filter(m => isFirstMatchDay(m.match_date)).length,
    groupCount: groupFilter
      ? matches.filter(m => m.home?.group_name === groupFilter).length
      : matches.filter(m => !!m.home?.group_name).length,
  };

  const chipLabel: Record<Filter, string> = {
    proximos: `${proximosCount} jogo${proximosCount !== 1 ? 's' : ''}`,
    hoje:     `${todayCount} jogo${todayCount !== 1 ? 's' : ''} hoje`,
    grupos:   `${groupCount} jogo${groupCount !== 1 ? 's' : ''}`,
    todos:    `${matches.length} jogos`,
  };

  useEffect(() => {
    if (filter === 'todos' && matchesByDay.length > 0 && !loading) {
      const targetDay =
        matchesByDay.find(d => d.label === 'Hoje') ||
        matchesByDay.find(d => d.matches.some(m => m.home_score === null));
      if (targetDay && dayRefs.current[targetDay.label]) {
        setTimeout(() => {
          dayRefs.current[targetDay.label]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [filter, loading, matchesByDay.length]);

  const openModal = (match: Match) => {
    const finished = match.home_score !== null && match.away_score !== null;
    const live = isLive(match.match_date);
    if (finished && !live) {
      setSelectedMatch(match);
      setIsResultModalOpen(true);
      return;
    }
    if (isMatchLocked(match.match_date)) return;
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleSavePick = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    extraTimeWinner: string | null,
    penaltiesWinner: string | null
  ) => {
    try {
      await savePick(matchId, homeScore, awayScore, extraTimeWinner, penaltiesWinner);
      showToast('Palpite salvo com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao salvar palpite. Tente novamente.', 'error');
    }
  };

  if (loading) return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>;

  return (
    <div className="flex flex-col pb-20">
      <MatchFilters
        filter={filter}
        groupFilter={groupFilter}
        onFilterChange={handleFilterChange}
        onGroupChange={setGroupFilter}
        availableFilters={availableFilters}
        chipLabel={chipLabel[filter]}
        isGroupStageOver={isGroupStageOver}
      />

      <div className="flex flex-col gap-[6px] px-5 pt-[10px]">
        {filteredMatches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-bolao-bg-card border border-bolao-border rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-bolao-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-bolao-muted text-sm font-medium">
              {filter === 'hoje' ? 'Nenhum jogo hoje' :
               filter === 'proximos' ? 'Nenhum jogo agendado' :
               filter === 'grupos' ? 'Nenhum jogo neste grupo' :
               'Nenhum jogo encontrado'}
            </p>
            <p className="text-bolao-muted/60 text-xs mt-1">
              {filter === 'hoje' ? 'Volte amanhã para novos palpites' :
               'Selecione outro filtro'}
            </p>
          </div>
        )}

        {filter === 'todos' ? (
          matchesByDay.map(({ label, matches: dayMatches }) => (
            <MatchDayGroup
              key={label}
              label={label}
              matches={dayMatches}
              getPick={(id) => userPicks[id]}
              isMatchLocked={isMatchLocked}
              isLive={isLive}
              liveMinute={liveMinute}
              formatTime={formatTime}
              onMatchClick={openModal}
              dayRef={(el) => { dayRefs.current[label] = el; }}
            />
          ))
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              pick={userPicks[match.id]}
              isLocked={isMatchLocked(match.match_date)}
              isLive={isLive(match.match_date)}
              liveMinute={liveMinute(match.match_date)}
              formatTime={formatTime}
              onClick={() => openModal(match)}
            />
          ))
        )}
      </div>

      {selectedMatch && (
        <>
          <ModalPalpite
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            match={selectedMatch}
            currentPick={userPicks[selectedMatch.id] || null}
            onSave={handleSavePick}
          />
          <ModalResultadoJogo
            isOpen={isResultModalOpen}
            onClose={() => setIsResultModalOpen(false)}
            match={selectedMatch}
          />
        </>
      )}
    </div>
  );
}