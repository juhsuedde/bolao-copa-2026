import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const API_KEY = '740d8f95c9f6ec08f8636c8d311096b3';

async function buscarGols() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Sincronizando Brasil...`);
  
  try {
    // Buscamos direto o jogo do Brasil pelo ID da API-Sports (ID: 1145537 - Exemplo, ou busca por time)
    // Para garantir, vamos listar os jogos "Live" agora:
    const resposta = await fetch(`https://v3.football.api-sports.io/fixtures?live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    const dados = await resposta.json();
    const jogosAPI = dados.response || [];

    // Busca o Brasil em qualquer lugar da lista de jogos AO VIVO
    const jogoBrt = jogosAPI.find(j => j.teams.home.name.includes('Brazil') || j.teams.away.name.includes('Brazil'));

    if (jogoBrt) {
      const hScore = jogoBrt.goals.home ?? 0;
      const aScore = jogoBrt.goals.away ?? 0;
      const sAPI = jogoBrt.fixture.status.short;

      console.log(`⚽ Brasil ${hScore} x ${aScore} França | Status: ${sAPI}`);

      const { data, error } = await supabase
        .from('matches')
        .update({ 
          home_score: hScore, 
          away_score: aScore,
          status: 'INPROGRESS' 
        })
        .eq('id', '1cef2353-92cb-4b93-955e-640724b7a07b')
        .select();

      if (data && data.length > 0) {
        console.log(`✅ SUCESSO! Banco atualizado: ${hScore}x${aScore}`);
      }
    } else {
      console.log('⚠️ Jogo do Brasil não encontrado nos jogos AO VIVO da API.');
      // Plano C: Tenta buscar por data fixa se o Live falhar
      console.log('Dica: Verifique se o jogo já começou na API-Sports.');
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  }
}

buscarGols();
setInterval(buscarGols, 240000);