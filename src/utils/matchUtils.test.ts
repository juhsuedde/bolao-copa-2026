import { describe, it, expect } from 'vitest';
import {
  isMatchLocked,
  isToday,
  isFirstMatchDay,
  isLive,
  liveMinute,
  formatTime,
  groupByDay,
  calculatePoints,
  calculateGroupClassifiedPoints,
  calculateFinalistsPoints,
  calculateChampionPoints,
  calculateTopScorerPoints,
} from './matchUtils';

describe('isMatchLocked', () => {
  it('returns false for empty date', () => {
    expect(isMatchLocked('')).toBe(false);
  });

  it('returns false when current time is before lock time', () => {
    const matchDate = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchDate).getTime() - 20 * 60 * 1000;
    expect(isMatchLocked(matchDate, currentTime)).toBe(false);
  });

  it('returns true when current time is after lock time', () => {
    const matchDate = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchDate).getTime() - 5 * 60 * 1000;
    expect(isMatchLocked(matchDate, currentTime)).toBe(true);
  });

  it('returns true exactly at lock time (10 min before)', () => {
    const matchDate = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchDate).getTime() - 10 * 60 * 1000;
    expect(isMatchLocked(matchDate, currentTime)).toBe(true);
  });
});

describe('isToday', () => {
  it('returns false for empty date', () => {
    expect(isToday('')).toBe(false);
  });

  it('returns true for today date', () => {
    const today = new Date().toISOString();
    expect(isToday(today)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });
});

describe('isFirstMatchDay', () => {
  it('returns false for empty date', () => {
    expect(isFirstMatchDay('')).toBe(false);
  });

  it('returns true for first match day', () => {
    expect(isFirstMatchDay('2026-06-11T16:00:00Z')).toBe(true);
  });

  it('returns false for other days', () => {
    expect(isFirstMatchDay('2026-06-12T14:00:00Z')).toBe(false);
  });
});

describe('isLive', () => {
  it('returns false for empty date', () => {
    expect(isLive('')).toBe(false);
  });

  it('returns true during match time', () => {
    const matchStart = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchStart).getTime() + 45 * 60 * 1000;
    expect(isLive(matchStart, currentTime)).toBe(true);
  });

  it('returns false before match starts', () => {
    const matchStart = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchStart).getTime() - 30 * 60 * 1000;
    expect(isLive(matchStart, currentTime)).toBe(false);
  });

  it('returns false after match ends (110min)', () => {
    const matchStart = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchStart).getTime() + 120 * 60 * 1000;
    expect(isLive(matchStart, currentTime)).toBe(false);
  });
});

describe('liveMinute', () => {
  it('returns 0 for empty date', () => {
    expect(liveMinute('')).toBe(0);
  });

  it('returns correct minute during match', () => {
    const matchStart = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchStart).getTime() + 30 * 60 * 1000;
    expect(liveMinute(matchStart, currentTime)).toBe(30);
  });

  it('caps at 90 minutes', () => {
    const matchStart = '2026-06-15T18:00:00Z';
    const currentTime = new Date(matchStart).getTime() + 120 * 60 * 1000;
    expect(liveMinute(matchStart, currentTime)).toBe(90);
  });
});

describe('formatTime', () => {
  it('returns empty string for empty date', () => {
    expect(formatTime('')).toBe('');
  });
});

describe('groupByDay', () => {
  it('returns empty array for empty matches', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('groups matches by day', () => {
    const matches = [
      { id: '1', match_date: '2026-06-15T18:00:00Z', stage: 'group_stage' },
      { id: '2', match_date: '2026-06-15T20:00:00Z', stage: 'group_stage' },
      { id: '3', match_date: '2026-06-16T16:00:00Z', stage: 'group_stage' },
    ] as any;
    const result = groupByDay(matches);
    expect(result.length).toBe(2);
  });

  it('labels today as "Hoje"', () => {
    const todayStr = new Date().toISOString();
    const matches = [{ id: '1', match_date: todayStr, stage: 'group_stage' }] as any;
    const result = groupByDay(matches);
    expect(result[0].label).toBe('Hoje');
  });

  it('skips matches without date', () => {
    const matches = [
      { id: '1', match_date: null, stage: 'group_stage' },
      { id: '2', match_date: '2026-06-15T18:00:00Z', stage: 'group_stage' },
    ] as any;
    const result = groupByDay(matches);
    expect(result.length).toBe(1);
  });
});

// ============================================================
// FASE DE GRUPOS
// ============================================================
describe('calculatePoints — fase de grupos', () => {
  it('returns 0 when match not played', () => {
    expect(calculatePoints(1, 0, null, null)).toBe(0);
  });

  it('returns 8 for exact score', () => {
    expect(calculatePoints(2, 1, 2, 1)).toBe(8);
  });

  it('returns 3 for correct winner only', () => {
    expect(calculatePoints(2, 0, 3, 1)).toBe(3);
  });

  it('returns 3 for correct draw (wrong score)', () => {
    expect(calculatePoints(0, 0, 1, 1)).toBe(3);
  });

  it('returns 8 for exact draw score', () => {
    expect(calculatePoints(1, 1, 1, 1)).toBe(8);
  });

  it('returns 0 for wrong score and wrong winner', () => {
    expect(calculatePoints(0, 0, 2, 1)).toBe(0);
  });

  it('ignores knockout extras in group stage', () => {
    // Extra time / penalties args present but isKnockout=false (default)
    expect(calculatePoints(1, 0, 1, 0, 'home', 'home', 'home', 'home')).toBe(8);
  });
});

// ============================================================
// MATA-MATA — Camada 1 (tempo normal)
// ============================================================
describe('calculatePoints — mata-mata camada 1', () => {
  it('returns 10 for exact score', () => {
    expect(calculatePoints(2, 1, 2, 1, null, null, null, null, true)).toBe(10);
  });

  it('returns 4 for correct winner only', () => {
    expect(calculatePoints(2, 0, 3, 1, null, null, null, null, true)).toBe(4);
  });

  it('returns 4 for correct "empate no tempo normal"', () => {
    expect(calculatePoints(1, 1, 0, 0, null, null, null, null, true)).toBe(4);
  });

  it('returns 0 for wrong result', () => {
    expect(calculatePoints(0, 1, 2, 0, null, null, null, null, true)).toBe(0);
  });
});

// ============================================================
// MATA-MATA — Camada 2 (prorrogação)
// ============================================================
describe('calculatePoints — mata-mata camada 2 (prorrogação)', () => {
  it('adds 5 pts for correct extra time winner', () => {
    // Placar errado (só 0 da camada 1) + acertou prorrogação
    expect(calculatePoints(1, 0, 0, 2, 'away', null, 'away', null, true)).toBe(5);
  });

  it('adds 5 pts on top of correct winner', () => {
    // Acertou vencedor (4) + acertou prorrogação (5) = 9
    expect(calculatePoints(2, 0, 3, 0, 'home', null, 'home', null, true)).toBe(9);
  });

  it('does NOT add pts when extra time winner is wrong', () => {
    expect(calculatePoints(2, 0, 3, 0, 'away', null, 'home', null, true)).toBe(4);
  });

  it('does NOT add pts when game did NOT go to extra time (actualExtraTimeWinner is null)', () => {
    expect(calculatePoints(2, 0, 3, 0, 'home', null, null, null, true)).toBe(4);
  });
});

// ============================================================
// MATA-MATA — Camada 3 (pênaltis)
// ============================================================
describe('calculatePoints — mata-mata camada 3 (pênaltis)', () => {
  it('adds 5 pts for correct penalties winner', () => {
    expect(calculatePoints(1, 1, 1, 1, 'empate', 'home', 'empate', 'home', true)).toBe(
      10 + 5 + 5, // exact (10) + extra time (5) + penalties (5)
    );
  });

  it('adds only penalties pts when extra time is wrong', () => {
    expect(calculatePoints(1, 1, 1, 1, 'away', 'home', 'empate', 'home', true)).toBe(
      10 + 0 + 5, // exact (10) + wrong ET (0) + correct pen (5)
    );
  });

  it('does NOT add pts when game did NOT go to penalties', () => {
    expect(calculatePoints(1, 1, 1, 1, 'empate', 'home', 'empate', null, true)).toBe(
      10 + 5 + 0, // exact (10) + correct ET (5) + no penalties (0)
    );
  });

  it('max knockout score is 20 pts (exact + ET + pen)', () => {
    expect(calculatePoints(2, 2, 2, 2, 'home', 'away', 'home', 'away', true)).toBe(20);
  });
});

// ============================================================
// PALPITES ESPECIAIS
// ============================================================
describe('calculateGroupClassifiedPoints', () => {
  it('returns 6 for both correct', () => {
    expect(calculateGroupClassifiedPoints(['br', 'ar'], ['ar', 'br'])).toBe(6);
  });

  it('returns 2 for one correct', () => {
    expect(calculateGroupClassifiedPoints(['br', 'ar'], ['br', 'de'])).toBe(2);
  });

  it('returns 0 for none correct', () => {
    expect(calculateGroupClassifiedPoints(['br', 'ar'], ['fr', 'de'])).toBe(0);
  });
});

describe('calculateFinalistsPoints', () => {
  it('returns 10 for both finalists correct', () => {
    expect(calculateFinalistsPoints(['br', 'fr'], ['fr', 'br'])).toBe(10);
  });

  it('returns 4 for one finalist correct', () => {
    expect(calculateFinalistsPoints(['br', 'fr'], ['br', 'de'])).toBe(4);
  });

  it('returns 0 for none correct', () => {
    expect(calculateFinalistsPoints(['br', 'fr'], ['ar', 'de'])).toBe(0);
  });
});

describe('calculateChampionPoints', () => {
  it('returns 15 for correct champion', () => {
    expect(calculateChampionPoints('br', 'br')).toBe(15);
  });

  it('returns 0 for wrong champion', () => {
    expect(calculateChampionPoints('br', 'fr')).toBe(0);
  });
});

describe('calculateTopScorerPoints', () => {
  it('returns 10 for correct top scorer (case-insensitive)', () => {
    expect(calculateTopScorerPoints('Mbappé (França)', 'mbappé (frança)')).toBe(10);
  });

  it('returns 0 for wrong top scorer', () => {
    expect(calculateTopScorerPoints('Mbappé (França)', 'Vinicius Jr (Brasil)')).toBe(0);
  });
});