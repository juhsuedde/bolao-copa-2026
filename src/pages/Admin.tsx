import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

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

    if (data) setMatches(data);
    if (error) console.error(error);
    setLoading(false);
  }

  async function updateMatch(id: string, home: number, away: number, stage: string) {
    const { error } = await supabase
      .from('matches')
      .update({ home_score: home, away_score: away, stage: stage })
      .eq('id', id);

    if (error) alert("Erro: " + error.message);
    else {
      alert("Resultado atualizado! Os pontos serão calculados via Trigger.");
      fetchMatches();
    }
  }

  if (loading) return <div className="p-10">Carregando painel de controle...</div>;

  return (
    <div className="p-6 pb-20 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Painel do Juiz ⚖️</h1>
      
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
                  defaultValue={m.home_score} 
                  id={`home-${m.id}`}
                  className="w-12 h-10 border rounded text-center font-bold"
                />
                <span className="self-center">x</span>
                <input 
                  type="number" 
                  defaultValue={m.away_score} 
                  id={`away-${m.id}`}
                  className="w-12 h-10 border rounded text-center font-bold"
                />
              </div>

              <div className="flex-1 text-left font-medium">{m.away?.name}</div>
            </div>

            <button 
              onClick={() => {
                const h = (document.getElementById(`home-${m.id}`) as HTMLInputElement).value;
                const a = (document.getElementById(`away-${m.id}`) as HTMLInputElement).value;
                updateMatch(m.id, parseInt(h), parseInt(a), m.stage);
              }}
              className="w-full mt-4 bg-gray-800 text-white py-2 rounded-md text-sm font-semibold hover:bg-black transition-colors"
            >
              Salvar Resultado Oficial
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}