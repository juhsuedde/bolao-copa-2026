import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const API_KEY = '740d8f95c9f6ec08f8636c8d311096b3';

async function buscarGols() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Sincronizando Brasil...`);
  
  try {
    // Primeiro tenta buscar jogos AO VIVO
    let resposta = await fetch(`https://v3.football.api-sports.io/fixtures?live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    let dados = await resposta.json();
    let jogosAPI = dados.response || [];

    // Busca o Brasil nos jogos live
    let jogoBrt = jogosAPI.find(j => j.teams.home.name.includes('Brazil') || j.teams.away.name.includes('Brazil'));

    // Se não achou ao vivo, busca TODOS os jogos de HOJE (não só do Brasil)
    if (!jogoBrt) {
      console.log('⚠️ Não achou Brasil no live, buscando todos os jogos de hoje...');
      const hoje = new Date().toISOString().split('T')[0];
      resposta = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoje}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      dados = await resposta.json();
      jogosAPI = dados.response || [];
      console.log(`📋 Total de jogos hoje: ${jogosAPI.length}`);
      jogoBrt = jogosAPI.find(j => j.teams.home.name.includes('Brazil') || j.teams.away.name.includes('Brazil'));
    }

    if (jogoBrt) {
      const hScore = jogoBrt.goals.home ?? 0;
      const aScore = jogoBrt.goals.away ?? 0;
      const sAPI = jogoBrt.fixture.status.short;
      const elapsed = jogoBrt.fixture.status.elapsed ?? 0;

      console.log(`⚽ Brasil ${hScore} x ${aScore} França | Status API: ${sAPI} (${elapsed}')`);

      const { data, error } = await supabase
        .from('matches')
        .update({ 
          home_score: hScore, 
          away_score: aScore,
          status: sAPI || 'INPROGRESS',
          elapsed: elapsed
        })
        .eq('id', 'fd35ae95-76c2-416c-b9c8-911c5452aa06')
        .select();

      if (data && data.length > 0) {
        console.log(`✅ SUCESSO! Banco atualizado: ${hScore}x${aScore} | Status: ${sAPI}`);
      }
    } else {
      console.log('⚠️ Jogo do Brasil não encontrado na API.');
      console.log('Dica: Verifique se o jogo já começou na API-Sports.');
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  }
}

buscarGols();
setInterval(buscarGols, 60000);