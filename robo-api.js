import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY;

console.log('🤖 Robô Oficial (SportAPI7) Iniciado e Vigiando!');

const url = 'https://sportapi7.p.rapidapi.com/api/v1/sport/football/scheduled-events/2026-03-26';

async function buscarGols() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Buscando atualizações na API...`);
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'sportapi7.p.rapidapi.com'
    }
  };

  try {
    const resposta = await fetch(url, options);
    const dados = await resposta.json();

    if (!dados.events) {
        console.log('⚠️ A API retornou os dados, mas a lista de jogos está vazia ou diferente.');
        return;
    }

    // 2. Procura pela Turquia (cobrindo as variações de nome em inglês e turco)
    const jogoTurquia = dados.events.find(e => 
      e.homeTeam?.name?.includes('Turkey') || 
      e.homeTeam?.name?.includes('Türkiye') ||
      e.awayTeam?.name?.includes('Turkey') ||
      e.awayTeam?.name?.includes('Türkiye')
    );

    if (jogoTurquia) {
      // 3. Captura os placares (A SportAPI7 guarda dentro de "homeScore.current")
      const homeScore = jogoTurquia.homeScore?.current ?? jogoTurquia.homeScore?.display ?? 0;
      const awayScore = jogoTurquia.awayScore?.current ?? jogoTurquia.awayScore?.display ?? 0;
      const status = jogoTurquia.status?.type || jogoTurquia.status?.description;

      console.log(`⚽ Encontrado! Turquia ${homeScore} x ${awayScore} Romênia (Status API: ${status})`);

      // 4. Se o jogo já começou (diferente de "notstarted"), manda pro banco!
      if (status !== 'notstarted' && status !== 'canceled') {
        const { error } = await supabase
          .from('matches')
          .update({ home_score: homeScore, away_score: awayScore , status: status})
          .eq('home_team', 'tur');
          
        if (error) {
           console.log('❌ Erro ao salvar no Supabase:', error.message);
        } else {
           console.log('✅ Banco atualizado! Se houve gol, os pontos do bolão foram recalculados.');
        }
      } else {
        console.log('⏳ O jogo ainda não começou. Aguardando a bola rolar às 14h...');
      }
    } else {
      console.log('⚠️ O jogo da Turquia não foi encontrado na lista atual da API.');
    }

  } catch (erro) {
    console.error('❌ Erro de conexão com a API:', erro.message);
  }
}

buscarGols();

setInterval(buscarGols, 600000);