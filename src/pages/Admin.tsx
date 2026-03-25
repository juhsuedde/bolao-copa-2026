import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { useToast } from '../hooks/useToast';

interface MatchData {
  id: string;
  date: string;
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
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const inputsRef = useRef<Record<string, MatchInput>>({});

  async function fetchMatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, date, home_score, away_score, stage,
        home:teams!home_team_id(name),
        away:teams!away_team_id(name)
      `)
      .order('date', { ascending: true });

    if (data) setMatches(data as unknown as MatchData[]);
    if (error) console.error(error);
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    const initialInputs: Record<string, MatchInput> = {};
    matches.forEach(m => {
      initialInputs[m.id] = { home: m.home_score ?? 0, away: m.away_score ?? 0 };
    });
    inputsRef.current = initialInputs;
  }, [matches]);

  async function updateMatch(id: string) {
    const input = inputsRef.current[id];
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

  if (roleLoading) {
    return <div className="p-10">Verificando permissões...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 pb-20 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-10">Carregando painel de controle...</div>;

  return (
    <div className="p-6 pb-20 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Painel do Juiz</h1>
      
      <div className="flex flex-col gap-6">
        {matches.map((m) => (
          <div key={m.id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>ID: {m.id.slice(0, 8)}</span>
              <span className="font-bold uppercase text-blue-600">{m.stage}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-right font-medium">{m.home?.name}</div>
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={inputsRef.current[m.id]?.home ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    inputsRef.current = {
                      ...inputsRef.current,
                      [m.id]: { ...inputsRef.current[m.id], home: val }
                    };
                    setMatches(prev => prev);
                  }}
                  className="w-12 h-10 border rounded text-center font-bold"
                />
                <span className="self-center">x</span>
                <input 
                  type="number" 
                  value={inputsRef.current[m.id]?.away ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    inputsRef.current = {
                      ...inputsRef.current,
                      [m.id]: { ...inputsRef.current[m.id], away: val }
                    };
                    setMatches(prev => prev);
                  }}
                  className="w-12 h-10 border rounded text-center font-bold"
                />
              </div>

              <div className="flex-1 text-left font-medium">{m.away?.name}</div>
            </div>

            <button 
              onClick={() => updateMatch(m.id)}
              disabled={saving === m.id}
              className="w-full mt-4 bg-gray-800 text-white py-2 rounded-md text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
            >
              {saving === m.id ? 'Salvando...' : 'Salvar Resultado Oficial'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}