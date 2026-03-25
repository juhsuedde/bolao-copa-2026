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

export type Pick = {
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
  extra_time_winner: string | null;
  penalties_winner: string | null;
};

export type Filter = 'proximos' | 'hoje' | 'grupos' | 'todos';
export type GroupFilter = string | null;

export type Tab = 'home' | 'jogos' | 'especiais' | 'ranking';

export const STAGE_LABELS: Record<string, string> = {
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinal',
  third_place:    '3º Lugar',
  final:          'Final',
};

export const FIRST_MATCH_DATE = new Date('2026-06-11T16:00:00Z');