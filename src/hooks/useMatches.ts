import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Match, Pick, Filter, GroupFilter } from '../types';

const MATCHES_QUERY_KEY = ['matches'];
const PICKS_QUERY_KEY = ['userPicks'];

async function fetchMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, match_date, stage, home_score, away_score, home_team, away_team,
      home:teams!matches_home_team_fkey(name, group_name, flag_url),
      away:teams!matches_away_team_fkey(name, group_name, flag_url)
    `)
    .order('match_date', { ascending: true });

  if (error) throw error;
  return data as unknown as Match[];
}

async function fetchUserPicks(userId: string) {
  const { data } = await supabase
    .from('match_picks')
    .select('match_id, home_score, away_score, points, extra_time_winner, penalties_winner')
    .eq('user_id', userId);

  if (!data) return {};
  const picksMap: Record<string, Pick> = {};
  data.forEach(pick => { picksMap[pick.match_id] = pick; });
  return picksMap;
}

function useTimer() {
  const [tick, setTick] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleNext = () => {
      const now = Date.now();
      const nextMinute = Math.ceil(now / 60000) * 60000;
      const delay = nextMinute - now;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setTick(t => t + 1);
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return tick;
}

export function useMatches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: MATCHES_QUERY_KEY,
    queryFn: fetchMatches,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: userPicks = {} as Record<string, Pick>, isLoading: loadingPicks } = useQuery({
    queryKey: PICKS_QUERY_KEY,
    queryFn: () => user ? fetchUserPicks(user.id) : Promise.resolve({} as Record<string, Pick>),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const savePickMutation = useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
      extraTimeWinner,
      penaltiesWinner
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      extraTimeWinner: string | null;
      penaltiesWinner: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const match = matches.find(m => m.id === matchId);
      const matchTime = match ? new Date(match.match_date).getTime() : 0;
      const lockTime = matchTime - 10 * 60 * 1000;
      
      if (Date.now() >= lockTime) {
        throw new Error('Tempo esgotado!');
      }

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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKS_QUERY_KEY });
    },
  });

  const timerTick = useTimer();

  const isMatchLocked = useCallback((matchDate: string) => {
    if (!matchDate) return false;
    return Date.now() >= new Date(matchDate).getTime() - 10 * 60 * 1000;
  }, [timerTick]);

  const isToday = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }, []);

  const isFirstMatchDay = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const first = new Date('2026-06-11T16:00:00Z');
    return (
      d.getDate() === first.getDate() &&
      d.getMonth() === first.getMonth() &&
      d.getFullYear() === first.getFullYear()
    );
  }, []);

  const isLive = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    const start = new Date(dateStr).getTime();
    const now = Date.now();
    return now >= start && now <= start + 110 * 60 * 1000;
  }, [timerTick]);

  const liveMinute = useCallback((dateStr: string) => {
    if (!dateStr) return 0;
    return Math.min(90, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  }, [timerTick]);

  const formatTime = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const savePick = useCallback((
    matchId: string,
    homeScore: number,
    awayScore: number,
    extraTimeWinner: string | null,
    penaltiesWinner: string | null
  ) => {
    return savePickMutation.mutateAsync({
      matchId,
      homeScore,
      awayScore,
      extraTimeWinner,
      penaltiesWinner,
    });
  }, [savePickMutation]);

  const isGroupStageOver = matches.length > 0 && matches.every(m => m.stage !== 'group_stage');

  const filterMatches = useCallback((filter: Filter, groupFilter: GroupFilter) => {
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
  }, [matches, isFirstMatchDay, isToday]);

  const getCounts = useCallback((filter: Filter, groupFilter: GroupFilter) => {
    const filtered = filterMatches(filter, groupFilter);
    const todayCount = matches.filter(m => isToday(m.match_date)).length;
    const proximosCount = matches.filter(m => isFirstMatchDay(m.match_date)).length;
    const groupCount = groupFilter
      ? matches.filter(m => m.home?.group_name === groupFilter).length
      : matches.filter(m => !!m.home?.group_name).length;

    return { count: filtered.length, todayCount, proximosCount, groupCount };
  }, [matches, filterMatches, isToday, isFirstMatchDay]);

  return {
    matches,
    userPicks,
    loading: loadingMatches || loadingPicks,
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
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PICKS_QUERY_KEY });
    },
  };
}