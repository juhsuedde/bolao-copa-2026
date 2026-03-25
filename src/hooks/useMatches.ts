import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Match, Pick, Filter, GroupFilter } from '../types';

export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const isFirstMatchDay = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const first = new Date('2026-06-11T16:00:00Z');
    return (
      d.getDate() === first.getDate() &&
      d.getMonth() === first.getMonth() &&
      d.getFullYear() === first.getFullYear()
    );
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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const savePick = async (
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

  const isGroupStageOver = matches.length > 0 && matches.every(m => m.stage !== 'group_stage');

  const filterMatches = (filter: Filter, groupFilter: GroupFilter) => {
    return matches.filter(m => {
      if (filter === 'proximos') return isFirstMatchDay(m.match_date);
      if (filter === 'hoje') return isToday(m.match_date);
      if (filter === 'grupos') {
        if (!m.home?.group_name) return false;
        if (groupFilter) return m.home.group_name === groupFilter;
        return true;
      }
      return true;
    });
  };

  const getCounts = (filter: Filter, groupFilter: GroupFilter) => {
    const filtered = filterMatches(filter, groupFilter);
    const todayCount = matches.filter(m => isToday(m.match_date)).length;
    const proximosCount = matches.filter(m => isFirstMatchDay(m.match_date)).length;
    const groupCount = groupFilter
      ? matches.filter(m => m.home?.group_name === groupFilter).length
      : matches.filter(m => !!m.home?.group_name).length;

    return { count: filtered.length, todayCount, proximosCount, groupCount };
  };

  return {
    matches,
    userPicks,
    loading,
    currentTime,
    isMatchLocked,
    isToday,
    isFirstMatchDay,
    isLive,
    liveMinute,
    formatTime,
    savePick,
    isGroupStageOver,
    filterMatches,
    getCounts,
    refetch: fetchData,
  };
}