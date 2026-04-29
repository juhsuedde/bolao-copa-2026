import type { User, Session } from '@supabase/supabase-js';

export const mockUser: User = {
  id: 'demo-user-001',
  email: 'demo@bolao.com',
  user_metadata: { full_name: 'Demo User', avatar_url: null },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const mockSession: Session = {
  user: mockUser,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'bearer',
  refresh_token: 'mock-refresh-token',
  access_token: 'mock-access-token',
};

export const SCORING_RULES = {
  exactScore: 10,
  correctWinner: 3,
  extraTime: 2,
  penalties: 2,
};

export type Team = {
  id: string;
  name: string;
  group_name: string;
  flag_url: string;
};

export const teams: Team[] = [
  { id: 'team-usa', name: 'Estados Unidos', group_name: 'A', flag_url: '' },
  { id: 'team-mex', name: 'México', group_name: 'A', flag_url: '' },
  { id: 'team-can', name: 'Canadá', group_name: 'A', flag_url: '' },
  { id: 'team-mar', name: 'Marrocos', group_name: 'A', flag_url: '' },
  { id: 'team-bra', name: 'Brasil', group_name: 'B', flag_url: '' },
  { id: 'team-col', name: 'Colômbia', group_name: 'B', flag_url: '' },
  { id: 'team-per', name: 'Peru', group_name: 'B', flag_url: '' },
  { id: 'team-ven', name: 'Venezuela', group_name: 'B', flag_url: '' },
  { id: 'team-arg', name: 'Argentina', group_name: 'C', flag_url: '' },
  { id: 'team-uru', name: 'Uruguai', group_name: 'C', flag_url: '' },
  { id: 'team-par', name: 'Paraguai', group_name: 'C', flag_url: '' },
  { id: 'team-chi', name: 'Chile', group_name: 'C', flag_url: '' },
  { id: 'team-fra', name: 'França', group_name: 'D', flag_url: '' },
  { id: 'team-eng', name: 'Inglaterra', group_name: 'D', flag_url: '' },
  { id: 'team-bel', name: 'Bélgica', group_name: 'D', flag_url: '' },
  { id: 'team-srb', name: 'Sérvia', group_name: 'D', flag_url: '' },
  { id: 'team-ger', name: 'Alemanha', group_name: 'E', flag_url: '' },
  { id: 'team-esp', name: 'Espanha', group_name: 'E', flag_url: '' },
  { id: 'team-ita', name: 'Itália', group_name: 'E', flag_url: '' },
  { id: 'team-cro', name: 'Croácia', group_name: 'E', flag_url: '' },
  { id: 'team-ned', name: 'Países Baixos', group_name: 'F', flag_url: '' },
  { id: 'team-por', name: 'Portugal', group_name: 'F', flag_url: '' },
  { id: 'team-sui', name: 'Suíça', group_name: 'F', flag_url: '' },
  { id: 'team-pol', name: 'Polônia', group_name: 'F', flag_url: '' },
  { id: 'team-jpn', name: 'Japão', group_name: 'G', flag_url: '' },
  { id: 'team-kor', name: 'Coreia do Sul', group_name: 'G', flag_url: '' },
  { id: 'team-aus', name: 'Austrália', group_name: 'G', flag_url: '' },
  { id: 'team-idn', name: 'Indonésia', group_name: 'G', flag_url: '' },
  { id: 'team-alg', name: 'Argélia', group_name: 'H', flag_url: '' },
  { id: 'team-egy', name: 'Egito', group_name: 'H', flag_url: '' },
  { id: 'team-nig', name: 'Nigéria', group_name: 'H', flag_url: '' },
  { id: 'team-gha', name: 'Gana', group_name: 'H', flag_url: '' },
];

export const matches = [
  { id: 'match-001', home_team: 'team-usa', away_team: 'team-mex', match_date: '2026-06-11T22:00:00Z', stage: 'group_stage', home_score: 1, away_score: 1, status: 'FINISHED', elapsed: null },
  { id: 'match-002', home_team: 'team-can', away_team: 'team-mar', match_date: '2026-06-11T22:00:00Z', stage: 'group_stage', home_score: 0, away_score: 2, status: 'FINISHED', elapsed: null },
  { id: 'match-003', home_team: 'team-bra', away_team: 'team-col', match_date: '2026-06-12T20:00:00Z', stage: 'group_stage', home_score: 2, away_score: 1, status: 'FINISHED', elapsed: null },
  { id: 'match-004', home_team: 'team-per', away_team: 'team-ven', match_date: '2026-06-12T20:00:00Z', stage: 'group_stage', home_score: 0, away_score: 0, status: 'FINISHED', elapsed: null },
  { id: 'match-005', home_team: 'team-arg', away_team: 'team-uru', match_date: '2026-06-13T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-006', home_team: 'team-par', away_team: 'team-chi', match_date: '2026-06-13T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-007', home_team: 'team-fra', away_team: 'team-eng', match_date: '2026-06-14T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-008', home_team: 'team-bel', away_team: 'team-srb', match_date: '2026-06-14T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-009', home_team: 'team-ger', away_team: 'team-esp', match_date: '2026-06-15T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-010', home_team: 'team-ita', away_team: 'team-cro', match_date: '2026-06-15T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-011', home_team: 'team-ned', away_team: 'team-por', match_date: '2026-06-16T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-012', home_team: 'team-sui', away_team: 'team-pol', match_date: '2026-06-16T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-013', home_team: 'team-jpn', away_team: 'team-kor', match_date: '2026-06-17T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-014', home_team: 'team-aus', away_team: 'team-idn', match_date: '2026-06-17T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-015', home_team: 'team-alg', away_team: 'team-egy', match_date: '2026-06-18T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-016', home_team: 'team-nig', away_team: 'team-gha', match_date: '2026-06-18T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-017', home_team: 'team-usa', away_team: 'team-can', match_date: '2026-06-19T22:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-018', home_team: 'team-mex', away_team: 'team-mar', match_date: '2026-06-19T22:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-019', home_team: 'team-bra', away_team: 'team-per', match_date: '2026-06-20T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-020', home_team: 'team-col', away_team: 'team-ven', match_date: '2026-06-20T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-021', home_team: 'team-arg', away_team: 'team-par', match_date: '2026-06-21T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-022', home_team: 'team-uru', away_team: 'team-chi', match_date: '2026-06-21T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-023', home_team: 'team-fra', away_team: 'team-bel', match_date: '2026-06-22T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-024', home_team: 'team-eng', away_team: 'team-srb', match_date: '2026-06-22T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-025', home_team: 'team-ger', away_team: 'team-ita', match_date: '2026-06-23T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-026', home_team: 'team-esp', away_team: 'team-cro', match_date: '2026-06-23T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-027', home_team: 'team-ned', away_team: 'team-sui', match_date: '2026-06-24T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-028', home_team: 'team-por', away_team: 'team-pol', match_date: '2026-06-24T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-029', home_team: 'team-jpn', away_team: 'team-aus', match_date: '2026-06-25T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-030', home_team: 'team-kor', away_team: 'team-idn', match_date: '2026-06-25T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-031', home_team: 'team-alg', away_team: 'team-nig', match_date: '2026-06-26T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-032', home_team: 'team-egy', away_team: 'team-gha', match_date: '2026-06-26T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-033', home_team: 'team-usa', away_team: 'team-mar', match_date: '2026-06-27T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-034', home_team: 'team-mex', away_team: 'team-can', match_date: '2026-06-27T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-035', home_team: 'team-bra', away_team: 'team-ven', match_date: '2026-06-28T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-036', home_team: 'team-col', away_team: 'team-per', match_date: '2026-06-28T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-037', home_team: 'team-arg', away_team: 'team-chi', match_date: '2026-06-29T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-038', home_team: 'team-uru', away_team: 'team-par', match_date: '2026-06-29T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-039', home_team: 'team-fra', away_team: 'team-srb', match_date: '2026-06-30T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-040', home_team: 'team-eng', away_team: 'team-bel', match_date: '2026-06-30T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-041', home_team: 'team-ger', away_team: 'team-cro', match_date: '2026-07-01T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-042', home_team: 'team-esp', away_team: 'team-ita', match_date: '2026-07-01T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-043', home_team: 'team-ned', away_team: 'team-pol', match_date: '2026-07-02T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-044', home_team: 'team-por', away_team: 'team-sui', match_date: '2026-07-02T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-045', home_team: 'team-jpn', away_team: 'team-idn', match_date: '2026-07-03T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-046', home_team: 'team-kor', away_team: 'team-aus', match_date: '2026-07-03T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-047', home_team: 'team-alg', away_team: 'team-gha', match_date: '2026-07-04T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-048', home_team: 'team-egy', away_team: 'team-nig', match_date: '2026-07-04T20:00:00Z', stage: 'group_stage', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-049', home_team: 'team-1a', away_team: 'team-2b', match_date: '2026-07-05T20:00:00Z', stage: 'round_of_16', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-050', home_team: 'team-1c', away_team: 'team-2d', match_date: '2026-07-05T20:00:00Z', stage: 'round_of_16', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-051', home_team: 'team-1e', away_team: 'team-2f', match_date: '2026-07-06T20:00:00Z', stage: 'round_of_16', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
  { id: 'match-052', home_team: 'team-1g', away_team: 'team-2h', match_date: '2026-07-06T20:00:00Z', stage: 'round_of_16', home_score: null, away_score: null, status: 'SCHEDULED', elapsed: null },
];

export const matchPicks = [
  { user_id: 'demo-user-001', match_id: 'match-001', home_score: 1, away_score: 1, points: 3, extra_time_winner: null, penalties_winner: null },
  { user_id: 'demo-user-001', match_id: 'match-002', home_score: 0, away_score: 2, points: 8, extra_time_winner: null, penalties_winner: null },
  { user_id: 'demo-user-001', match_id: 'match-003', home_score: 2, away_score: 1, points: 10, extra_time_winner: null, penalties_winner: null },
  { user_id: 'demo-user-001', match_id: 'match-004', home_score: 1, away_score: 0, points: 0, extra_time_winner: null, penalties_winner: null },
];

export const specialPicks = [
  { user_id: 'demo-user-001', pick_type: 'champion', team_id: 'team-bra', player_name: null },
  { user_id: 'demo-user-001', pick_type: 'top_scorer', team_id: null, player_name: 'Vinícius Júnior' },
  { user_id: 'demo-user-001', pick_type: 'finalist_1', team_id: 'team-arg', player_name: null },
  { user_id: 'demo-user-001', pick_type: 'finalist_2', team_id: 'team-fra', player_name: null },
];

export type LeaderboardEntry = {
  user_id: string;
  total_points: number;
  group_points: number;
  match_points: number;
  special_points: number;
  user: { name: string; avatar_url: string | null };
};

export const leaderboard: LeaderboardEntry[] = [
  { user_id: 'user-001', total_points: 120, group_points: 42, match_points: 58, special_points: 20, user: { name: 'Carlos Silva', avatar_url: null } },
  { user_id: 'user-002', total_points: 108, group_points: 38, match_points: 50, special_points: 20, user: { name: 'Maria Santos', avatar_url: null } },
  { user_id: 'user-003', total_points: 95, group_points: 35, match_points: 45, special_points: 15, user: { name: 'João Oliveira', avatar_url: null } },
  { user_id: 'demo-user-001', total_points: 89, group_points: 32, match_points: 37, special_points: 20, user: { name: 'Demo User', avatar_url: null } },
  { user_id: 'user-004', total_points: 82, group_points: 28, match_points: 44, special_points: 10, user: { name: 'Ana Costa', avatar_url: null } },
  { user_id: 'user-005', total_points: 78, group_points: 30, match_points: 38, special_points: 10, user: { name: 'Pedro Lima', avatar_url: null } },
  { user_id: 'user-006', total_points: 65, group_points: 25, match_points: 30, special_points: 10, user: { name: 'Julia Alves', avatar_url: null } },
  { user_id: 'user-007', total_points: 52, group_points: 18, match_points: 24, special_points: 10, user: { name: 'Lucas Ferreira', avatar_url: null } },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find(t => t.id === id);
}

export function getMatchWithTeams(match: typeof matches[0]) {
  const home = getTeamById(match.home_team);
  const away = getTeamById(match.away_team);
  return {
    ...match,
    home: home ? { name: home.name, group_name: home.group_name, flag_url: home.flag_url } : null,
    away: away ? { name: away.name, group_name: away.group_name, flag_url: away.flag_url } : null,
  };
}

export function getAllMatchesWithTeams() {
  return matches.map(getMatchWithTeams);
}