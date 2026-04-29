import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mockUser, mockSession, teams, matchPicks, specialPicks, leaderboard, getAllMatchesWithTeams } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function applyFilters<T extends Record<string, any>>(items: T[], filters: Record<string, any>): T[] {
  let result = [...items];
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    
    if (typeof value === 'object' && value.$ne !== undefined) {
      result = result.filter(item => item[key] !== value.$ne);
    } else {
      result = result.filter(item => item[key] === value);
    }
  }
  
  return result;
}

function applyOrder<T extends Record<string, any>>(items: T[], order: { column: string; ascending: boolean } | null): T[] {
  if (!order) return items;
  
  return [...items].sort((a, b) => {
    const aVal = a[order.column];
    const bVal = b[order.column];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (aVal < bVal) return order.ascending ? -1 : 1;
    if (aVal > bVal) return order.ascending ? 1 : -1;
    return 0;
  });
}

function createMockQueryBuilder(tableName: string) {
  let appliedFilters: Record<string, any> = {};
  let appliedOrder: { column: string; ascending: boolean } | null = null;
  let appliedLimit: number | null = null;

  const builder: any = {
    select: () => builder,
    eq: (column: string, value: any) => {
      appliedFilters[column] = value;
      return builder;
    },
    neq: (column: string, value: any) => {
      appliedFilters[column] = { $ne: value };
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      appliedOrder = { column, ascending: options?.ascending ?? true };
      return builder;
    },
    limit: (count: number) => {
      appliedLimit = count;
      return builder;
    },
    single: () => ({
      then: (resolve: (value: any) => void) => {
        delay().then(() => {
          let data: any = null;
          const error = null;

          if (tableName === 'matches') {
            const allMatches = getAllMatchesWithTeams();
            const filtered = applyFilters(allMatches, appliedFilters);
            const ordered = applyOrder(filtered, appliedOrder);
            const limited = appliedLimit ? ordered.slice(0, appliedLimit) : ordered;
            data = limited[0] || null;
          } else if (tableName === 'teams') {
            const filtered = applyFilters(teams, appliedFilters);
            const ordered = applyOrder(filtered, appliedOrder);
            data = ordered[0] || null;
          } else if (tableName === 'users') {
            if (appliedFilters.id === mockUser.id) {
              data = mockUser;
            }
          } else if (tableName === 'sessions') {
            data = { user: mockUser };
          }

          resolve({ data, error });
        });
        return builder;
      }
    }),
    then: (resolve: (value: any) => void) => {
      delay().then(() => {
        let data: any = [];
        const error = null;

        if (tableName === 'matches') {
          const allMatches = getAllMatchesWithTeams();
          const filtered = applyFilters(allMatches, appliedFilters);
          const ordered = applyOrder(filtered, appliedOrder);
          data = appliedLimit ? ordered.slice(0, appliedLimit) : ordered;
        } else if (tableName === 'teams') {
          const filtered = applyFilters(teams, appliedFilters);
          const ordered = applyOrder(filtered, appliedOrder);
          data = appliedLimit ? ordered.slice(0, appliedLimit) : ordered;
        } else if (tableName === 'match_picks') {
          const filtered = applyFilters(matchPicks as any, appliedFilters);
          data = filtered;
        } else if (tableName === 'special_picks') {
          const filtered = applyFilters(specialPicks as any, appliedFilters);
          data = filtered;
        } else if (tableName === 'leaderboard') {
          const filtered = applyFilters(leaderboard as any, appliedFilters);
          const ordered = applyLeaderboardOrder(filtered as typeof leaderboard, appliedOrder);
          data = appliedLimit ? ordered.slice(0, appliedLimit) : ordered;
        }

        resolve({ data, error });
      });
      return builder;
    },
    insert: () => ({
      then: (resolve: (value: any) => void) => {
        delay().then(() => {
          resolve({ data: [{}], error: null });
        });
        return builder;
      }
    }),
    update: () => ({
      eq: () => ({
        then: (resolve: (value: any) => void) => {
          delay().then(() => {
            resolve({ data: [{}], error: null });
          });
          return builder;
        }
      })
    }),
    delete: () => ({
      eq: () => ({
        then: (resolve: (value: any) => void) => {
          delay().then(() => {
            resolve({ data: null, error: null });
          });
          return builder;
        }
      })
    }),
    upsert: () => ({
      then: (resolve: (value: any) => void) => {
        delay().then(() => {
          resolve({ data: [{}], error: null });
        });
        return builder;
      },
      onConflict: () => builder
    }),
    subscribe: () => {
      return {
        unsubscribe: () => {}
      };
    }
  };

  return builder;
}

function applyLeaderboardOrder(items: typeof leaderboard, order: { column: string; ascending: boolean } | null): typeof leaderboard {
  if (!order) return items;
  
  return [...items].sort((a, b) => {
    const aVal = a[order.column as keyof typeof a];
    const bVal = b[order.column as keyof typeof b];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order.ascending ? bVal - aVal : aVal - bVal;
    }
    
    if (aVal < bVal) return order.ascending ? -1 : 1;
    if (aVal > bVal) return order.ascending ? 1 : -1;
    return 0;
  });
}

const createMockSupabase = (): SupabaseClient => {
  return {
    from: (tableName: string) => createMockQueryBuilder(tableName),
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: any) => {
        callback('INITIAL_SESSION', mockSession);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithOAuth: () => Promise.resolve({ data: { provider: 'google', url: 'mock://url' } as any, error: null }),
      signOut: () => Promise.resolve({ data: {}, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null }),
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({ status: 'SUBSCRIBED' })
      }),
      subscribe: () => ({ status: 'SUBSCRIBED' })
    }),
    removeChannel: () => Promise.resolve()
  } as unknown as SupabaseClient;
};

export const supabase = useMock ? createMockSupabase() : createClient(supabaseUrl, supabaseAnonKey);