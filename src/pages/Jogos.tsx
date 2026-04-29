import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalPalpite from '../components/ModalPalpite';
import ModalResultadoJogo from '../components/ModalResultadoJogo';
import { useToast } from '../hooks/useToast';
import type { Match } from '../types';
import { isLive as isLiveUtil, isFinished as isFinishedUtil } from '../utils/matchUtils';

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
  round_of_16: 'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals: 'Semifinal',
  third_place: '3º Lugar',
  final: 'Final',
};

function groupByDay(matches: Match[]): { label: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    if (!m.match_date) continue;
    const d = new Date(m.match_date.replace(' ', 'T'));
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
  const { showToast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [filter, setFilter] = useState<Filter>('hoje');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Tick a cada minuto para atualizar o indicador de minuto ao vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Busca os dados do banco ───────────────────────────────────────────────
  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, match_date, stage, home_score, away_score, home_team, away_team, status, elapsed,
        home:teams!matches_home_team_fkey(name, group_name, flag_url),
        away:teams!matches_away_team_fkey(name, group_name, flag_url)
      `)
      .order('match_date', { ascending: true });

    console.log('Matches fetched:', data);
    if (error) { console.error('Erro ao buscar jogos:', error); return; }
    if (data) setMatches(data as unknown as Match[]);
  }, []);

  const fetchPicks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('match_picks')
      .select('match_id, home_score, away_score, points, extra_time_winner, penalties_winner')
      .eq('user_id', user.id);
    if (data) {
      const map: Record<string, Pick> = {};
      data.forEach(p => { map[p.match_id] = p; });
      setUserPicks(map);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMatches(), fetchPicks()]);
    setLoading(false);
  }, [fetchMatches, fetchPicks]);

  // Carga inicial
  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Realtime: atualiza instantaneamente quando o robô grava no banco ──────
  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return;
    }

    const channel = supabase
      .channel('matches-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          // Atualiza só o jogo que mudou, sem rebuscar tudo
          setMatches(prev =>
            prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } as Match : m)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Scroll automático para hoje ao entrar em "Todos" ─────────────────────
  const matchesByDay = filter === 'todos' ? groupByDay(matches) : [];
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

  const isGroupStageOver = matches.length > 0 && matches.every(m => m.stage !== 'group_stage');
  useEffect(() => {
    if (isGroupStageOver && filter === 'grupos') {
      setFilter('hoje');
      setGroupFilter(null);
    }
  }, [isGroupStageOver, filter]);

  const isMatchLocked = (match: Match) => {
    if (!match.match_date) return false;
    if (isLiveUtil(match)) return false; // jogo ao vivo = travado mas não mostra cadeado
    const matchTime = new Date(match.match_date.replace(' ', 'T')).getTime();
    return Date.now() >= matchTime - 10 * 60 * 1000;
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr.replace(' ', 'T'));
    const today = new Date();
    const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return dUTC === todayUTC;
  };

  const liveMinute = (match: Match) => {
    if (!isLiveUtil(match)) return 0;
    if (match.elapsed) return match.elapsed;
    if (!match.match_date) return 0;
    const start = new Date(match.match_date.replace(' ', 'T')).getTime();
    return Math.min(90, Math.floor((currentTime - start) / 60000));
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr.replace(' ', 'T')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const openModal = (match: Match) => {
    const live = isLiveUtil(match);
    const finished = isFinishedUtil(match);
    if (live) return; // jogos ao vivo não podem ser clicados
    if (finished && !live) {
      setSelectedMatch(match);
      setIsResultModalOpen(true);
      return;
    }
    if (isMatchLocked(match)) return;
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
    if (match && isMatchLocked(match)) { showToast('Tempo esgotado!', 'error'); return; }

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

    if (error) {
      showToast('Erro ao salvar palpite: ' + error.message, 'error');
    } else {
      showToast('Palpite salvo!', 'success');
      fetchPicks();
    }
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
    hoje: `${todayCount} jogo${todayCount !== 1 ? 's' : ''} hoje`,
    grupos: `${groupCount} jogo${groupCount !== 1 ? 's' : ''}`,
    todos: `${matches.length} jogos`,
  };

  const availableFilters: Filter[] = isGroupStageOver ? ['hoje', 'todos'] : ['hoje', 'grupos', 'todos'];
  const filterLabel: Record<Filter, string> = { hoje: 'Hoje', grupos: 'Grupos', todos: 'Todos' };

  const getPtsBadge = (pick: Pick | undefined, finished: boolean) => {
    if (!pick) return null;
    if (!finished) {
      return (
        <span className="hchip" style={{ background: 'var(--bg3)', color: 'var(--muted)', border: '1px solid var(--border)', fontSize: '10px' }}>
          Aguardando
        </span>
      );
    }
    if (pick.points === 0) {
      return (
        <span className="hchip" style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #F0B0AA', fontSize: '10px' }}>
          0 pts
        </span>
      );
    }
    return (
      <span className="hchip" style={{ background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--green-mid)', fontSize: '10px' }}>
        +{pick.points} pts{pick.points >= 8 ? ' · exato!' : ''}
      </span>
    );
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const pick = userPicks[match.id];
    const locked = isMatchLocked(match);
    const live = isLiveUtil(match);
    const finished = isFinishedUtil(match);
    const isKnockout = match.stage !== 'group_stage';
    const stageLabel = isKnockout
      ? (STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, ' '))
      : match.home?.group_name ? `Grupo ${match.home.group_name}` : 'Fase de grupos';

    return (
      <div className="animate-fade-in">
        <div
          onClick={() => openModal(match)}
          className={`glass-card px-4 py-3 transition-all ${pick ? 'border-l-[3px]' : ''} ${finished ? 'opacity-60' : locked ? 'opacity-75' : ''}`}
          style={{
            borderLeftColor: pick ? 'var(--green-mid)' : undefined,
            cursor: finished || !locked ? 'pointer' : 'default',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {stageLabel}
            </span>
            {live ? (
              <span className="flex items-center gap-1.5" style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>
                <span className="live-dot" />
                AO VIVO {liveMinute(match)}'
              </span>
            ) : locked ? (
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                {finished ? formatTime(match.match_date) : '🔒 Fechado'}
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{formatTime(match.match_date)}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span style={{ fontSize: '14px', fontWeight: 600 }} className="truncate">
                {match.home?.name || match.home_team}
              </span>
              {match.home?.flag_url ? (
                <img src={match.home.flag_url} alt={match.home.name} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" style={{ border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
              ) : <span className="flex-shrink-0">⚽</span>}
            </div>

            <div className="px-3 flex-shrink-0">
              {(live || finished) && match.home_score !== null ? (
                <div className="flex items-center gap-1.5">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '20px', fontWeight: 700 }}>{match.home_score}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>x</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '20px', fontWeight: 700 }}>{match.away_score}</span>
                </div>
              ) : (
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: 'var(--muted)', letterSpacing: '2px' }}>VS</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
              {match.away?.flag_url ? (
                <img src={match.away.flag_url} alt={match.away.name} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" style={{ border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
              ) : <span className="flex-shrink-0">⚽</span>}
              <span style={{ fontSize: '14px', fontWeight: 600 }} className="truncate text-right">
                {match.away?.name || match.away_team}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(226,223,214,0.4)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {finished && !live ? (
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>Ver palpites →</span>
              ) : pick ? (
                <span>Palpite: <strong>{pick.home_score}–{pick.away_score}</strong></span>
              ) : locked ? (
                <span style={{ color: live ? 'var(--muted)' : 'var(--red)' }}>
                  {live ? 'Ao vivo' : 'Sem palpite'}
                </span>
              ) : (
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>Palpitar agora →</span>
              )}
            </div>
            <div>
              {getPtsBadge(pick, finished && !live) ?? <span style={{ fontSize: '11px', color: 'var(--border)' }}>—</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse-glow inline-block">⚽</div>
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="screen-header">
        <h1 className="screen-title">Jogos</h1>
        <span className="hchip green">{chipLabel[filter]}</span>
      </div>

      <div className="flex gap-2 px-5 py-3 overflow-x-auto hide-scrollbar">
        {availableFilters.map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              if (f === 'grupos') setGroupFilter('A');
              else setGroupFilter(null);
            }}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{
              background: filter === f ? (f === 'hoje' ? 'var(--green)' : 'var(--green-light)') : 'rgba(255,255,255,0.7)',
              color: filter === f ? (f === 'hoje' ? '#fff' : 'var(--green)') : 'var(--muted)',
              border: `1px solid ${filter === f ? (f === 'hoje' ? 'var(--green)' : 'var(--green-mid)') : 'var(--border)'}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filter === 'grupos' && (
        <div className="px-5 pb-2">
          <div className="grid grid-cols-6 gap-1.5">
            {availableGroups.map(g => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className="h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{
                  background: groupFilter === g ? 'var(--text)' : 'rgba(255,255,255,0.7)',
                  color: groupFilter === g ? 'var(--bg)' : 'var(--muted)',
                  border: `1px solid ${groupFilter === g ? 'var(--text)' : 'var(--border)'}`,
                  backdropFilter: 'blur(6px)',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scroll" style={{ padding: '0 20px' }}>
        {filteredMatches.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p style={{ fontSize: '28px', marginBottom: '8px' }}>⚽</p>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              {filter === 'hoje' ? 'Nenhum jogo hoje.' : 'Nenhum jogo encontrado.'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 stagger-children">
          {filter === 'todos' ? (
            matchesByDay.map(({ label, matches: dayMatches }) => (
              <div key={label}>
                <div ref={el => { dayRefs.current[label] = el; }} className="scroll-mt-24">
                  <div className="flex items-center justify-between py-2 px-1">
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: 'var(--text)', letterSpacing: '0.5px' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      {dayMatches.length} jogo{dayMatches.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayMatches.map(match => <MatchCard key={match.id} match={match} />)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredMatches.map(match => <MatchCard key={match.id} match={match} />)
          )}
        </div>
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