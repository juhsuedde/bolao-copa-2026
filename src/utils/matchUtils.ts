import type { Match } from '../types';

export function isMatchLocked(matchDate: string, currentTime: number = Date.now()): boolean {
  if (!matchDate) return false;
  return currentTime >= new Date(matchDate).getTime() - 10 * 60 * 1000;
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return dUTC === todayUTC;
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

export function isLive(match: Match): boolean {
  const status = (match.status || '').toUpperCase();
  return status === 'INPROGRESS' || status === '1H' || status === '2H' || status === 'HT' || status === 'HALFTIME';
}

export function isFinished(match: Match): boolean {
  const status = (match.status || '').toUpperCase();
  const finishedByStatus = status === 'FINISHED' || status === 'FT' || status === 'AET' || status === 'PEN';
  const finishedByScore = match.home_score !== null && match.away_score !== null && finishedByStatus;
  return finishedByStatus || finishedByScore;
}

export function liveMinute(match: Match, currentTime: number = Date.now()): number {
  if (!isLive(match)) return 0;
  if (match.elapsed) return match.elapsed;
  if (!match.match_date) return 0;
  const start = new Date(match.match_date).getTime();
  return Math.min(90, Math.floor((currentTime - start) / 60000));
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
    const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const isTodayDate = dUTC === todayUTC;
    const key = isTodayDate
      ? 'Hoje'
      : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, matches]) => ({ label, matches }));
}

/**
 * Calcula pontos para um palpite de jogo.
 *
 * FASE DE GRUPOS:
 *   - Placar exato: 8 pts
 *   - Vencedor correto / empate correto: 3 pts
 *
 * MATA-MATA (isKnockout = true):
 *   Camada 1 — placar no tempo normal:
 *     - Placar exato: 10 pts
 *     - Vencedor/empate correto: 4 pts
 *   Camada 2 — só pontua se o jogo foi para prorrogação:
 *     - Acertou quem classificou na prorrogação (ou empate → pênaltis): 5 pts
 *   Camada 3 — só pontua se o jogo foi para pênaltis:
 *     - Acertou quem classificou nos pênaltis: 5 pts
 */
export function calculatePoints(
  pickHomeScore: number,
  pickAwayScore: number,
  actualHomeScore: number | null,
  actualAwayScore: number | null,
  // Knockout extras (preenchidos antes do jogo, pontam só se a situação ocorrer)
  pickExtraTimeWinner?: string | null,
  pickPenaltiesWinner?: string | null,
  // Resultados reais do mata-mata
  actualExtraTimeWinner?: string | null,
  actualPenaltiesWinner?: string | null,
  isKnockout: boolean = false,
): number {
  if (actualHomeScore === null || actualAwayScore === null) return 0;

  const isExact = pickHomeScore === actualHomeScore && pickAwayScore === actualAwayScore;
  const pickWinner = getWinner(pickHomeScore, pickAwayScore);
  const actualWinner = getWinner(actualHomeScore, actualAwayScore);
  const isCorrectWinner = pickWinner === actualWinner;

  let points = 0;

  if (isKnockout) {
    // Camada 1
    if (isExact) {
      points += 10;
    } else if (isCorrectWinner) {
      points += 4;
    }
    // Camada 2 — só pontua se houve prorrogação
    if (
      actualExtraTimeWinner !== null &&
      actualExtraTimeWinner !== undefined &&
      pickExtraTimeWinner === actualExtraTimeWinner
    ) {
      points += 5;
    }
    // Camada 3 — só pontua se houve pênaltis
    if (
      actualPenaltiesWinner !== null &&
      actualPenaltiesWinner !== undefined &&
      pickPenaltiesWinner === actualPenaltiesWinner
    ) {
      points += 5;
    }
  } else {
    // Fase de grupos
    if (isExact) {
      points += 8;
    } else if (isCorrectWinner) {
      points += 3;
    }
  }

  return points;
}

function getWinner(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

/**
 * Calcula pontos especiais.
 *
 * Classificados por grupo (por grupo):
 *   - 2 acertos: 6 pts
 *   - 1 acerto: 2 pts
 *
 * Times na Final:
 *   - 2 acertos: 10 pts
 *   - 1 acerto: 4 pts
 *
 * Campeão: 15 pts
 * Artilheiro: 10 pts
 */
export function calculateGroupClassifiedPoints(
  picked: [string, string],
  actual: [string, string],
): number {
  const hits = picked.filter(p => actual.includes(p)).length;
  if (hits === 2) return 6;
  if (hits === 1) return 2;
  return 0;
}

export function calculateFinalistsPoints(
  picked: [string, string],
  actual: [string, string],
): number {
  const hits = picked.filter(p => actual.includes(p)).length;
  if (hits === 2) return 10;
  if (hits === 1) return 4;
  return 0;
}

export function calculateChampionPoints(pickedTeamId: string, actualChampionId: string): number {
  return pickedTeamId === actualChampionId ? 15 : 0;
}

export function calculateTopScorerPoints(pickedName: string, actualName: string): number {
  return pickedName.trim().toLowerCase() === actualName.trim().toLowerCase() ? 10 : 0;
}