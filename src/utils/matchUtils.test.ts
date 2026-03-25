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

  it('returns true during match time (90min + 20min extra)', () => {
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

  it('formats time correctly', () => {
    expect(formatTime('2026-06-15T18:30:00Z')).toBe('15:30');
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
    const today = new Date();
    const todayStr = today.toISOString();
    const matches = [
      { id: '1', match_date: todayStr, stage: 'group_stage' },
    ] as any;

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

describe('calculatePoints', () => {
  it('returns 0 when match not played', () => {
    expect(calculatePoints(1, 0, null, null)).toBe(0);
  });

  it('returns 10 points for exact score', () => {
    expect(calculatePoints(2, 1, 2, 1)).toBe(10);
  });

  it('returns 3 points for correct winner only', () => {
    expect(calculatePoints(2, 0, 3, 1)).toBe(3);
  });

  it('returns 0 for wrong score and winner', () => {
    expect(calculatePoints(0, 0, 2, 1)).toBe(0);
  });

  it('returns 3 points for correct draw', () => {
    expect(calculatePoints(1, 1, 1, 1)).toBe(10);
  });

  it('returns 0 when pick is draw but actual is not draw', () => {
    expect(calculatePoints(0, 0, 1, 0)).toBe(0);
  });

  it('adds 2 points for extra time winner in knockout', () => {
    expect(calculatePoints(1, 1, 1, 1, 'home', null, 'home', null)).toBe(12);
  });

  it('adds 2 points for penalties winner in knockout', () => {
    expect(calculatePoints(1, 1, 1, 1, null, 'away', null, 'away')).toBe(12);
  });

  it('adds both extra time and penalties points', () => {
    expect(calculatePoints(1, 1, 1, 1, 'home', 'home', 'home', 'home')).toBe(14);
  });
});
