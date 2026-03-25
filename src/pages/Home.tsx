import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type RankUser = {
  user_id: string;
  total_points: number;
  user: {
    name: string;
    avatar_url: string | null;
  };
};

const AVATARS = ['🦁', '🐯', '🦊', '⚡', '🌙', '🎯', '🔥', '🐉', '🦅', '🌟'];

const FIRST_MATCH_DATE = new Date('2026-06-11T00:00:00Z');

export default function Home() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreCopaBanner, setShowPreCopaBanner] = useState(false);

  useEffect(() => {
    setShowPreCopaBanner(new Date() < FIRST_MATCH_DATE);

    async function fetchRanking() {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          total_points,
          user:users(name, avatar_url)
        `)
        .order('total_points', { ascending: false });

      if (data && !error) {
        setRanking(data as unknown as RankUser[]);
      } else {
        console.error('Erro ao buscar o ranking:', error);
      }
      setLoading(false);
    }

    fetchRanking();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando...</div>;
  }

  const myRankIndex = ranking.findIndex(r => r.user_id === user?.id);
  const myData = myRankIndex !== -1 ? ranking[myRankIndex] : null;
  const myPosition = myRankIndex !== -1 ? myRankIndex + 1 : null;

  return (
    <div className="flex flex-col gap-4 pb-20">

      <div className="px-5 pt-5 flex items-center justify-between bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Início</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          Bolão da Copa 2026
        </div>
      </div>

      {/* Hero card de pontuação */}
      <div className="mx-5 bg-bolao-green rounded-2xl p-5 text-white relative overflow-hidden shadow-lg mt-2">
        <div className="absolute -right-2 -top-4 font-display text-[120px] text-white opacity-5 select-none pointer-events-none leading-none">
          2026
        </div>
        <div className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-75 mb-1">
          Sua pontuação
        </div>
        <div className="text-xl font-semibold mb-1 truncate pr-16">
          {myData?.user?.name || user?.user_metadata?.full_name || 'Jogador'}
        </div>
        <div className="font-mono text-5xl leading-none mt-2 flex items-baseline gap-1">
          {myData?.total_points ?? 0}
          <span className="text-sm font-sans font-normal opacity-75">pts</span>
        </div>
        <div className="absolute top-5 right-5 text-center">
          <div className="font-display text-[52px] leading-none opacity-90">
            {myPosition ? `${myPosition}º` : '–'}
          </div>
          <div className="text-[10px] opacity-75 tracking-wider">
            {myPosition ? 'lugar' : 'sem pts'}
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="px-5">
        <div className="text-[10px] text-bolao-muted font-semibold tracking-[0.1em] uppercase mb-3">
          Ranking do bolão
        </div>

        <div className="flex flex-col gap-2">
          {ranking.map((row, index) => {
            const isMe = row.user_id === user?.id;
            const position = index + 1;

            return (
              <div
                key={row.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isMe
                    ? 'bg-bolao-green-light border-bolao-green-mid'
                    : 'bg-bolao-bg-card border-bolao-border'
                }`}
              >
                <div className={`font-mono text-xs w-4 text-center shrink-0 font-semibold ${
                  position === 1 ? 'text-yellow-600' :
                  position === 2 ? 'text-gray-500' :
                  position === 3 ? 'text-amber-700' :
                  'text-bolao-muted'
                }`}>
                  {position}
                </div>
                <div className={`w-9 h-9 rounded-full bg-bolao-bg border-2 flex items-center justify-center overflow-hidden shrink-0 text-base ${
                  isMe ? 'border-bolao-green' : 'border-bolao-border'
                }`}>
                  {row.user?.avatar_url ? (
                    <img src={row.user.avatar_url} alt={row.user.name} className="w-full h-full object-cover" />
                  ) : (
                    AVATARS[index] ?? '👤'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1 truncate">
                    {row.user?.name || 'Sem nome'}
                    {isMe && <span className="text-[10px] text-bolao-green font-bold shrink-0">(você)</span>}
                  </div>
                </div>
                <div className={`font-mono text-[15px] font-medium ${isMe ? 'text-bolao-gold' : 'text-bolao-green'}`}>
                  {row.total_points}
                </div>
              </div>
            );
          })}

          {ranking.length === 0 && (
            <div className="text-center p-6 text-bolao-muted text-sm border border-dashed border-bolao-border rounded-xl">
              Ninguém pontuou ainda. Seja o primeiro!
            </div>
          )}
        </div>
      </div>

      {/* Banner pré-Copa — visível apenas antes do 1º jogo */}
      {showPreCopaBanner && (
        <div className="mx-5 bg-bolao-bg-card border border-bolao-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          
          {/* Cabeçalho do Banner */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-5 flex items-center justify-center shrink-0 text-lg">
              ⏳
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-bolao-text tracking-wide uppercase leading-tight">
                A Copa ainda não começou
              </div>
              <div className="text-[11px] text-bolao-muted mt-1 leading-normal">
                Você começará a pontuar assim que a bola rolar!
              </div>
            </div>
          </div>

          {/* Lista de Dicas */}
          <div className="flex flex-col gap-4">
            
            {/* Item: Jogos */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-5 flex items-center justify-center shrink-0 text-bolao-green text-sm font-bold">
                ⚽
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-bold text-bolao-text leading-tight">Aba Jogos</div>
                <div className="text-[11px] text-bolao-muted mt-1 leading-normal">
                  Pode palpitar quando quiser, mas 10 minutos antes de cada partida os jogos travam.
                </div>
              </div>
            </div>

            {/* Item: Especiais */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-5 flex items-center justify-center shrink-0 text-bolao-gold text-sm font-bold">
                ★
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-bold text-bolao-text leading-tight">Aba Especiais</div>
                <div className="text-[11px] text-bolao-muted mt-1 leading-normal">
                  Vote nos classificados por grupo, times da final, campeão e artilheiro antes do primeiro jogo.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Logout discreto */}
      <div className="px-5 mt-2">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] text-bolao-muted border border-bolao-border rounded-xl bg-bolao-bg-card hover:bg-bolao-bg active:opacity-70 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair da conta
        </button>
      </div>

    </div>
  );
}