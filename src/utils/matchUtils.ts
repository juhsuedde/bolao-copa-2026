import type { Match } from '../types';

export function isMatchLocked(matchDate: string, currentTime: number = Date.now()): boolean {
  if (!matchDate) return false;
  return currentTime >= new Date(matchDate).getTime() - 10 * 60 * 1000;
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isFirstMatchDay(dateStr: string, firstMatchDate: string = '2026-06-11T16:00:00Z'): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const first = new Date(firstMatchDate);
  return (
    d.getDate() === first.getDate() &&
    d.getMonth() === first.getMonth() &&
    d.getFullYear() === first.getFullYear()
  );
}

export function isLive(dateStr: string, currentTime: number = Date.now()): boolean {
  if (!dateStr) return false;
  const start = new Date(dateStr).getTime();
  return currentTime >= start && currentTime <= start + 110 * 60 * 1000;
}

export function liveMinute(dateStr: string, currentTime: number = Date.now()): number {
  if (!dateStr) return 0;
  return Math.min(90, Math.floor((currentTime - new Date(dateStr).getTime()) / 60000));
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function groupByDay(matches: Match[]): { label: string; matches: Match[] }[] {
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

export function calculatePoints(
  pickHomeScore: number,
  pickAwayScore: number,
  actualHomeScore: number | null,
  actualAwayScore: number | null,
  pickExtraTimeWinner?: string | null,
  pickPenaltiesWinner?: string | null,
  actualExtraTimeWinner?: string | null,
  actualPenaltiesWinner?: string | null
): number {
  if (actualHomeScore === null || actualAwayScore === null) return 0;

  const isCorrectScore = pickHomeScore === actualHomeScore && pickAwayScore === actualAwayScore;
  const isCorrectWinner = getWinner(pickHomeScore, pickAwayScore) === getWinner(actualHomeScore, actualAwayScore);
  
  let points = 0;

  if (isCorrectScore) {
    points += 10;
  } else if (isCorrectWinner) {
    points += 3;
  }

  if (pickExtraTimeWinner && actualExtraTimeWinner && pickExtraTimeWinner === actualExtraTimeWinner) {
    points += 2;
  }

  if (pickPenaltiesWinner && actualPenaltiesWinner && pickPenaltiesWinner === actualPenaltiesWinner) {
    points += 2;
  }

  return points;
}

function getWinner(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}
