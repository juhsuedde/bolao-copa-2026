import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useUserRole } from '../hooks/useUserRole';

interface MatchData {
  id: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  stage: string;
  home: { name: string };
  away: { name: string };
}

interface MatchInput {
  home: number;
  away: number;
}

export default function Admin() {
  const { isAdmin } = useUserRole();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // 2. Trocamos o useRef problemático por um useState correto
  const [inputs, setInputs] = useState<Record<string, MatchInput>>({});

  async function fetchMatches() {
    setLoading(true);
    // 3. Corrigimos os nomes das colunas para bater com o banco real
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, match_date, home_score, away_score, stage,
        home:teams!matches_home_team_fkey(name),
        away:teams!matches_away_team_fkey(name)
      `)
      .order('match_date', { ascending: true });

    if (error) {
      console.error(error);
      showToast('Erro ao carregar jogos', 'error');
    }
    
    if (data) {
      setMatches(data as unknown as MatchData[]);
      const initialInputs: Record<string, MatchInput> = {};
      data.forEach(m => {
        initialInputs[m.id] = { home: m.home_score ?? 0, away: m.away_score ?? 0 };
      });
      setInputs(initialInputs);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  async function updateMatch(id: string) {
    const input = inputs[id];
    if (!input) return;

    setSaving(id);
    const { error } = await supabase
      .from('matches')
      .update({ home_score: input.home, away_score: input.away })
      .eq('id', id);

    if (error) {
      showToast('Erro: ' + error.message, 'error');
    } else {
      showToast('Resultado atualizado com sucesso!', 'success');
      fetchMatches();
    }
    setSaving(null);
  }

  if (!isAdmin) {
    return (
      <div className="p-6 pb-20 bg-bolao-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-bolao-text">Acesso Negado</h1>
          <p className="text-bolao-muted">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center font-bold text-bolao-muted">Carregando painel de controle...</div>;

  return (
    <div className="p-6 pb-20 min-h-screen" style={{ background: 'var(--bg)' }}>
      <h1 className="text-2xl font-bold mb-6 text-bolao-text">Painel do Juiz</h1>
      
      <div className="flex flex-col gap-6">
        {matches.map((m) => (
          <div key={m.id} className="p-4 rounded-xl shadow-sm border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-xs mb-3 text-bolao-muted">
              <span>ID: {m.id.slice(0, 8)}</span>
              <span className="font-bold uppercase" style={{ color: 'var(--green)' }}>{m.stage.replace(/_/g, ' ')}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-right font-medium text-bolao-text">{m.home?.name}</div>
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={inputs[m.id]?.home ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setInputs(prev => ({
                      ...prev,
                      [m.id]: { ...prev[m.id], home: val }
                    }));
                  }}
                  className="w-12 h-10 border rounded text-center font-bold"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <span className="self-center font-bold text-bolao-muted">x</span>
                <input 
                  type="number" 
                  value={inputs[m.id]?.away ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setInputs(prev => ({
                      ...prev,
                      [m.id]: { ...prev[m.id], away: val }
                    }));
                  }}
                  className="w-12 h-10 border rounded text-center font-bold"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="flex-1 text-left font-medium text-bolao-text">{m.away?.name}</div>
            </div>

            <button 
              onClick={() => updateMatch(m.id)}
              disabled={saving === m.id}
              className="w-full mt-5 py-3 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--green)', color: '#fff' }}
            >
              {saving === m.id ? 'Salvando...' : 'Salvar resultado oficial'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}