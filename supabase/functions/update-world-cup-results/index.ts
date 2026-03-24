import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// A chave da API fica como variável de ambiente do Supabase (nunca hardcoded)
// Configure em: Supabase Dashboard → Edge Functions → Secrets → FOOTBALL_API_KEY
const API_KEY = Deno.env.get('FOOTBALL_API_KEY') ?? ''
const BASE_URL = 'https://api.football-data.org/v4/competitions/WC/matches'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const response = await fetch(BASE_URL, {
      headers: { 'X-Auth-Token': API_KEY }
    })

    if (!response.ok) {
      throw new Error(`API respondeu com status ${response.status}`)
    }

    const data = await response.json()
    const matchesFromApi = data.matches ?? []
    let updated = 0

    for (const apiMatch of matchesFromApi) {
      if (apiMatch.status === 'FINISHED') {
        const { error } = await supabase
          .from('matches')
          .update({
            home_score: apiMatch.score.fullTime.home,
            away_score: apiMatch.score.fullTime.away,
          })
          .eq('api_id', apiMatch.id)

        if (error) {
          console.error(`Erro no jogo ${apiMatch.id}:`, error.message)
        } else {
          updated++
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Sincronização concluída!', updated }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})