import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_KEY = '45888e22facc4c4db88dfa39472b375a' // Cole sua chave aqui
const BASE_URL = 'https://api.football-data.org/v4/competitions/WC/matches'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Busca os jogos na API
    const response = await fetch(BASE_URL, {
      headers: { 'X-Auth-Token': API_KEY }
    })
    
    const data = await response.json()
    const matchesFromApi = data.matches

    // 2. Itera pelos jogos e atualiza apenas os FINALIZADOS
    for (const apiMatch of matchesFromApi) {
      if (apiMatch.status === 'FINISHED') {
        const { error } = await supabase
          .from('matches')
          .update({
            home_score: apiMatch.score.fullTime.home,
            away_score: apiMatch.score.fullTime.away,
            // A nossa Trigger SQL de pontuação vai disparar sozinha aqui!
          })
          .eq('api_id', apiMatch.id) // O link mágico pelo ID da API
        
        if (error) console.error(`Erro no jogo ${apiMatch.id}:`, error.message)
      }
    }

    return new Response(JSON.stringify({ message: "Sincronização concluída!" }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})