import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalPalpite from '../components/ModalPalpite';
import ModalResultadoJogo from '../components/ModalResultadoJogo';

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home: { name: string; group_name: string; flag_url: string };
  away: { name: string; group_name: string; flag_url: string };
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
  extra_time_winner: string | null;
  penalties_winner: string | null;
};

type Filter = 'hoje' | 'grupos' | 'todos';
type GroupFilter = string | null;

const STAGE_LABELS: Record<string, string> = {
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinal',
  third_place:    '3º Lugar',
  final:          'Final',
};

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
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [filter, setFilter] = useState<Filter>('hoje');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
  
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
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
        .select('match_id, home_score, away_score, points, extra_time_winner, penalties_winner')
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

  const matchesByDay = filter === 'todos' ? groupByDay(matches) : [];

  useEffect(() => {
    if (filter === 'todos' && matchesByDay.length > 0 && !loading) {
      const targetDay = matchesByDay.find(day => day.label === 'Hoje') || 
                        matchesByDay.find(day => day.matches.some(m => m.home_score === null));

      if (targetDay && dayRefs.current[targetDay.label]) {
        setTimeout(() => {
          dayRefs.current[targetDay.label]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 150);
      }
    }
  }, [filter, loading, matchesByDay.length]);

  const isGroupStageOver = matches.length > 0 && matches.every(m => m.stage !== 'group_stage');
  
  useEffect(() => {
    if (isGroupStageOver && filter === 'grupos') {
      setFilter('hoje');
      setGroupFilter(null);
    }
  }, [isGroupStageOver, filter]);

  const openModal = (match: Match) => {
    const finished = match.home_score !== null && match.away_score !== null;
    if (finished) {
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
        penalties_winner: penaltiesWinner,
      }, { onConflict: 'user_id,match_id' });

    if (error) alert(error.message);
    else fetchData();
  };

  const availableGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const filteredMatches = matches.filter(m => {
    if (filter === 'hoje') return isToday(m.match_date);
    if (filter === 'grupos') {
      if (!m.home?.group_name) return false;
      if (groupFilter) return m.home.group_name === groupFilter;
      return true;
    }
    return true; 
  });

  const todayCount = matches.filter(m => isToday(m.match_date)).length;
  const groupCount = groupFilter
    ? matches.filter(m => m.home?.group_name === groupFilter).length
    : matches.filter(m => !!m.home?.group_name).length;

  const chipLabel: Record<Filter, string> = {
    hoje:   `${todayCount} jogo${todayCount !== 1 ? 's' : ''} hoje`,
    grupos: `${groupCount} jogo${groupCount !== 1 ? 's' : ''}`,
    todos:  `${matches.length} jogos`,
  };

  const availableFilters: Filter[] = isGroupStageOver
    ? ['hoje', 'todos']
    : ['hoje', 'grupos', 'todos'];

  const filterLabel: Record<Filter, string> = {
    hoje:   'Hoje',
    grupos: 'Grupos',
    todos:  'Todos',
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isLive = (dateStr: string) => {
    if (!dateStr) return false;
    const start = new Date(dateStr).getTime();
    return currentTime >= start && currentTime <= start + 110 * 60 * 1000;
  };

  const liveMinute = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.min(90, Math.floor((currentTime - new Date(dateStr).getTime()) / 60000));
  };

  const getPtsBadge = (pick: Pick | undefined, finished: boolean) => {
    if (!pick) return null;
    if (!finished) {
      return (
        <span className="text-[10px] font-bold bg-bolao-bg border border-bolao-border text-bolao-muted px-2 py-0.5 rounded-full">
          Aguardando
        </span>
      );
    }
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        pick.points >= 8 ? 'bg-bolao-green-light text-bolao-green' : 
        pick.points > 0 ? 'bg-bolao-green-light text-bolao-green' : 'bg-bolao-red-light text-bolao-red'
      }`}>
        +{pick.points} pts {pick.points >= 8 && '· exato!'}
      </span>
    );
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const pick = userPicks[match.id];
    const locked = isMatchLocked(match.match_date);
    const live = isLive(match.match_date);
    const finished = match.home_score !== null && match.away_score !== null;
    const isKnockout = match.stage !== 'group_stage';
    const stageLabel = isKnockout
      ? (STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, ' '))
      : match.home?.group_name
      ? `Grupo ${match.home.group_name}`
      : 'Fase de grupos';

    return (
      <div
        onClick={() => openModal(match)}
        className={`bg-bolao-bg-card border rounded-[9px] px-3 py-[9px] transition-colors ${
          pick ? 'border-l-[3px] border-bolao-green-mid' : 'border-bolao-border'
        } ${finished ? 'opacity-60 cursor-pointer active:bg-gray-50 border-bolao-green-mid/40' : locked ? 'opacity-70' : 'cursor-pointer active:bg-gray-50'}`}
      >
        <div className="flex justify-between items-center mb-[7px]">
          <span className="text-[10px] font-semibold text-bolao-muted tracking-[0.07em] uppercase">
            {stageLabel}
          </span>
          {live ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-bolao-red tracking-[0.07em]">
              <span className="inline-block w-[5px] h-[5px] rounded-full bg-bolao-red animate-pulse" />
              AO VIVO {liveMinute(match.match_date)}'
            </span>
          ) : locked && finished ? (
            <span className="text-[10px] text-bolao-muted font-mono">{formatTime(match.match_date)}</span>
          ) : locked ? (
            <span className="text-[10px] font-semibold text-bolao-red">🔒 Fechado</span>
          ) : (
            <span className="text-[10px] text-bolao-muted font-mono">{formatTime(match.match_date)}</span>
          )}
        </div>

        <div className="flex items-center">
          <div className="flex-1 flex items-center justify-end gap-2 pr-3">
            <span className="text-[13px] font-medium text-right leading-tight">
              {match.home?.name || match.home_team}
            </span>
            {match.home?.flag_url ? (
              <img src={match.home.flag_url} alt={match.home.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border shrink-0" />
            ) : (
              <span className="text-[18px] shrink-0">⚽</span>
            )}
          </div>

          <div className="w-[52px] text-center flex-shrink-0 bg-bolao-bg rounded p-1 border border-bolao-border">
            {finished ? (
              <span className="font-mono text-[15px] font-bold text-bolao-text">
                {match.home_score}
                <span className="text-bolao-muted text-[10px] mx-0.5">x</span>
                {match.away_score}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-bolao-muted block py-1">VS</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 pl-3">
            {match.away?.flag_url ? (
              <img src={match.away.flag_url} alt={match.away.name} className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border shrink-0" />
            ) : (
              <span className="text-[18px] shrink-0">⚽</span>
            )}
            <span className="text-[13px] font-medium text-left leading-tight">
              {match.away?.name || match.away_team}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-[7px] pt-[6px] border-t border-bolao-border">
          <div className="flex items-center gap-2">
            {finished ? (
              <span className="text-[11px] text-bolao-green font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Ver palpites →
              </span>
            ) : pick ? (
              <span className="text-[11px] text-bolao-muted">
                Palpite: <strong className="text-bolao-text font-mono">{pick.home_score}–{pick.away_score}</strong>
              </span>
            ) : locked ? (
              <span className="text-[11px] text-bolao-red font-medium">Sem palpite</span>
            ) : (
              <span className="text-[11px] text-bolao-green font-semibold">Palpitar agora →</span>
            )}
          </div>
          {getPtsBadge(pick, finished) ?? <span className="text-[10px] text-bolao-muted">—</span>}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>;

  return (
    <div className="flex flex-col pb-20">
      <div className="flex items-center justify-between px-5 pt-5 pb-0 bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {chipLabel[filter]}
        </div>
      </div>

      <div className="flex gap-[6px] px-5 pt-[10px] pb-0 overflow-x-auto no-scrollbar">
        {availableFilters.map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              if (f === 'grupos') setGroupFilter('A');
              else setGroupFilter(null);
            }}
            className={`flex-shrink-0 px-[13px] py-[6px] rounded-full text-[11px] font-semibold border transition-all ${
              filter === f ? (f === 'hoje' ? 'bg-bolao-green text-white border-bolao-green' : 'bg-bolao-green-light border-bolao-green-mid text-bolao-green') : 'bg-bolao-bg-card border-bolao-border text-bolao-muted'
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filter === 'grupos' && (
        <div className="px-5 pt-3 pb-2">
          <div className="grid grid-cols-6 gap-2">
            {availableGroups.map(g => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`h-9 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-all ${
                  groupFilter === g ? 'bg-bolao-text text-bolao-bg border-bolao-text shadow-sm' : 'bg-bolao-bg-card border-bolao-border text-bolao-muted'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[6px] px-5 pt-[10px]">
        {filteredMatches.length === 0 && (
          <div className="text-center py-10 text-bolao-muted text-sm">
            {filter === 'hoje' ? 'Nenhum jogo hoje.' : 'Nenhum jogo encontrado.'}
          </div>
        )}

        {filter === 'todos' ? (
          matchesByDay.map(({ label, matches: dayMatches }) => (
            <div key={label} ref={el => { dayRefs.current[label] = el; }} className="scroll-mt-24">
              <div className="flex items-center gap-3 py-2">
                <span className="text-[11px] font-bold text-bolao-text uppercase tracking-[0.08em]">{label}</span>
                <div className="flex-1 h-px bg-bolao-border" />
                <span className="text-[10px] text-bolao-muted">{dayMatches.length} jogo{dayMatches.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col gap-[6px]">
                {dayMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            </div>
          ))
        ) : (
          filteredMatches.map(match => <MatchCard key={match.id} match={match} />)
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