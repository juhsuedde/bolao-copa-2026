import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const API_KEY = '740d8f95c9f6ec08f8636c8d311096b3';

async function buscarGols() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Sincronizando jogos com a API...`);
  
  try {
    const hoje = new Date().toLocaleString("en-CA", {timeZone: "America/Sao_Paulo"}).split(',')[0];
    const resposta = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoje}`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    const dados = await resposta.json();
    const jogosAPI = dados.response || [];

    console.log(`📡 Recebi ${jogosAPI.length} jogos da API hoje.`);

    for (const jogo of jogosAPI) {
      if (jogo.teams.home.name.includes('Brazil')) {
        const homeScore = jogo.goals.home ?? 0;
        const awayScore = jogo.goals.away ?? 0;
        const statusAPI = jogo.fixture.status.short;

        const idRealDoBrasil = '1cef2353-92cb-4b93-955e-640724b7a07b'; 

        console.log(`🎯 Tentando atualizar ID: ${idRealDoBrasil}...`);

        const { data, error } = await supabase
          .from('matches')
          .update({ 
            home_score: homeScore, 
            away_score: awayScore,
            status: statusAPI === 'NS' ? 'NOTSTARTED' : 'INPROGRESS'
          })
          .eq('id', idRealDoBrasil)
          .select();

        if (error) {
          console.log('❌ ERRO NO SUPABASE:', error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ VITÓRIA! Brasil atualizado: ${homeScore}x${awayScore}`);
        } else {
          console.log('⚠️ O ID existe, mas nenhuma linha foi alterada (talvez RLS?)');
        }
      }
    }

  } catch (erro) {
    console.error('❌ Erro no processamento:', erro.message);
  }
}

// Inicia o robô
buscarGols();
setInterval(buscarGols, 240000);