/**
 * robo-api.js — Robô de sincronização de resultados da Copa 2026
 * API: wc2026api.com (100 req/dia grátis, dedicada à Copa 2026)
 *
 * Uso: node robo-api.js
 * Roda localmente nos dias de jogo. Atualiza o banco a cada 60s enquanto
 * houver jogos ao vivo, e a cada 5min fora de jogos.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const WC_API_KEY  = process.env.WC2026_API_KEY;
const WC_BASE_URL = 'https://api.wc2026api.com';

// Status da wc2026api que indicam jogo ao vivo
const LIVE_STATUSES = ['1h', '2h', 'ht', 'et', 'live', 'inprogress'];
// Status que indicam jogo encerrado
const FINISHED_STATUSES = ['ft', 'aet', 'pen', 'finished'];

// Intervalo de polling: 60s com jogos ao vivo, 5min sem
let pollingInterval = 5 * 60 * 1000;
let timer = null;

function isLive(status = '') {
  return LIVE_STATUSES.includes(status.toLowerCase());
}

function isFinished(status = '') {
  return FINISHED_STATUSES.includes(status.toLowerCase());
}

async function fetchLiveMatches() {
  const res = await fetch(`${WC_BASE_URL}/matches?status=live`, {
    headers: { 'Authorization': `Bearer ${WC_API_KEY}` }
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? json.matches ?? []);
}

async function fetchTodayMatches() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const res = await fetch(`${WC_BASE_URL}/matches?date=${today}`, {
    headers: { 'Authorization': `Bearer ${WC_API_KEY}` }
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? json.matches ?? []);
}

async function sincronizar() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Sincronizando...`);

  try {
    // 1. Busca jogos ao vivo
    let jogos = await fetchLiveMatches();
    console.log(`   🔴 Jogos ao vivo na API: ${jogos.length}`);

    // 2. Se não há ao vivo, busca todos de hoje (para pegar resultados recém-terminados)
    if (jogos.length === 0) {
      jogos = await fetchTodayMatches();
      console.log(`   📋 Jogos de hoje na API: ${jogos.length}`);
    }

    if (jogos.length === 0) {
      console.log('   ℹ️  Nenhum jogo encontrado.');
      ajustarIntervalo(false);
      return;
    }

    let temAoVivo = false;
    let atualizados = 0;

    for (const jogo of jogos) {
      const status    = (jogo.status || '').toLowerCase();
      const homeScore = jogo.home_score ?? jogo.score?.home ?? null;
      const awayScore = jogo.away_score ?? jogo.score?.away ?? null;
      const elapsed   = jogo.elapsed   ?? jogo.minute ?? null;
      // A wc2026api usa "id" como identificador do jogo
      const apiId     = jogo.id;

      if (!apiId) continue;

      if (isLive(status)) temAoVivo = true;

      // Só atualiza se o jogo está ao vivo ou encerrado (tem placar)
      if (!isLive(status) && !isFinished(status)) continue;
      if (homeScore === null || awayScore === null) continue;

      // Mapeia status da API para o nosso padrão interno
      const statusInterno = isLive(status)     ? 'INPROGRESS'
                          : isFinished(status) ? 'FINISHED'
                          : status.toUpperCase();

      console.log(`   ⚽ Jogo #${apiId} | ${homeScore}x${awayScore} | ${status} ${elapsed ? `(${elapsed}')` : ''}`);

      const { data, error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: statusInterno,
          elapsed: elapsed,
        })
        .eq('api_id', apiId)
        .select('id');

      if (error) {
        console.error(`   ❌ Erro ao atualizar jogo #${apiId}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`   ✅ Atualizado: jogo #${apiId} → ${homeScore}x${awayScore}`);
        atualizados++;
      } else {
        // Jogo não encontrado pelo api_id — pode precisar cadastrar no banco
        console.warn(`   ⚠️  Jogo #${apiId} não encontrado no banco. Cadastrou na tabela matches?`);
      }
    }

    console.log(`   📊 Total atualizado: ${atualizados} jogo(s)`);
    ajustarIntervalo(temAoVivo);

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    ajustarIntervalo(false);
  }
}

function ajustarIntervalo(temAoVivo) {
  const novoIntervalo = temAoVivo ? 60 * 1000 : 5 * 60 * 1000;
  if (novoIntervalo !== pollingInterval) {
    pollingInterval = novoIntervalo;
    const label = temAoVivo ? '60s (ao vivo)' : '5min (sem jogos)';
    console.log(`   🔄 Intervalo ajustado para ${label}`);
    if (timer) {
      clearInterval(timer);
      timer = setInterval(sincronizar, pollingInterval);
    }
  }
}

// Executa imediatamente e depois em loop
sincronizar();
timer = setInterval(sincronizar, pollingInterval);

console.log('🤖 Robô iniciado. Ctrl+C para parar.');
console.log('   API: wc2026api.com');
console.log('   Intervalo inicial: 5min (ajusta para 60s quando houver jogos ao vivo)\n');
