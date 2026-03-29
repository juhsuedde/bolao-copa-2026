/**
 * seed-api.js — Popula/sincroniza a tabela matches do banco
 * com os 104 jogos da Copa 2026 vindos da wc2026api.com
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

// Dicionário de tradução Inglês (API) -> Português (Banco) sem acentos
const translationMap = {
  'south africa': 'africa do sul',
  'korea republic': 'coreia do sul',
  'usa': 'estados unidos',
  'brazil': 'brasil',
  'morocco': 'marrocos',
  'scotland': 'escocia',
  'germany': 'alemanha',
  'netherlands': 'holanda', 
  'japan': 'japao',
  "côte d'ivoire": 'costa do marfim',
  'spain': 'espanha',
  'belgium': 'belgica',
  'egypt': 'egito',
  'saudi arabia': 'arabia saudita',
  'uruguay': 'uruguai',
  'ir iran': 'ira',
  'new zealand': 'nova zelandia',
  'france': 'franca',
  'algeria': 'argelia',
  'austria': 'austria',
  'jordan': 'jordania',
  'england': 'inglaterra',
  'croatia': 'croacia',
  'ghana': 'gana',
  'uzbekistan': 'usbequistao', // com S
  'colombia': 'colombia',
  'switzerland': 'suica',
  'mexico': 'mexico',
  'canada': 'canada',
  'ecuador': 'equador',
  'cameroon': 'camaroes',
  'qatar': 'catar',
  // --- Novos Adicionados ---
  'paraguay': 'paraguai',
  'australia': 'australia',
  'curaçao': 'curacao',
  'curaçao': 'curacau',
  'portugal': 'portugal',
  'norway': 'noruega',
  'senegal': 'senegal',
  'uzbekistan': 'uzbequistao' // com Z, por garantia
};

function mapStage(round = '') {
  const r = round.toLowerCase();
  if (r === 'group')          return 'group_stage';
  if (r === 'round of 32')    return 'round_of_32';
  if (r === 'round of 16')    return 'round_of_16';
  if (r === 'quarter-final'  || r === 'quarter_final' || r === 'quarterfinal') return 'quarter_finals';
  if (r === 'semi-final'     || r === 'semi_final'    || r === 'semifinal')    return 'semi_finals';
  if (r === 'third place'    || r === 'third_place')                           return 'third_place';
  if (r === 'final')          return 'final';
  return r; 
}

// Função ninja para remover acentos na hora de comparar
const removeAcentos = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

async function seed() {
  console.log('🌱 Iniciando seed da tabela matches...\n');

  console.log('📡 Buscando jogos da wc2026api.com...');
  const res = await fetch(`${WC_BASE_URL}/matches`, {
    headers: { 'Authorization': `Bearer ${WC_API_KEY}` }
  });

  if (!res.ok) {
    console.error(`❌ Erro na API: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const json = await res.json();
  const jogosAPI = Array.isArray(json) ? json : (json.data ?? json.matches ?? []);
  console.log(`✅ ${jogosAPI.length} jogos recebidos da API\n`);

  console.log('🔍 Buscando times do banco...');
  const { data: timesDB, error: timesError } = await supabase
    .from('teams')
    .select('id, name');

  if (timesError) {
    console.error('❌ Erro ao buscar times:', timesError.message);
    process.exit(1);
  }

  console.log(`✅ ${timesDB.length} times no banco\n`);

  // Index de nome limpo (sem acento) → id para lookup rápido
  const timeIndex = {};
  for (const t of timesDB) {
    timeIndex[removeAcentos(t.name)] = t.id;
    // Tenta guardar com e sem 'Países Baixos/Holanda' por garantia
    timeIndex[removeAcentos(t.name).replace('paises baixos', 'holanda')] = t.id;
  }

  let criados = 0, atualizados = 0, erros = 0, semTime = 0;

  for (const jogo of jogosAPI) {
    const homeNomeAPI = (jogo.home_team || '').toLowerCase();
    const awayNomeAPI = (jogo.away_team || '').toLowerCase();
    
    // Passa pelo tradutor antes de buscar
    const homeNomeTraduzido = translationMap[homeNomeAPI] || homeNomeAPI;
    const awayNomeTraduzido = translationMap[awayNomeAPI] || awayNomeAPI;

    const homeId = timeIndex[homeNomeTraduzido];
    const awayId = timeIndex[awayNomeTraduzido];

    if (!homeId || !awayId) {
      if (homeNomeAPI && awayNomeAPI && !jogo.home_team.includes('Winner')) {
        console.warn(`⚠️ Times não encontrados no banco: "${jogo.home_team}" vs "${jogo.away_team}"`);
      }
      semTime++;
      continue;
    }

    const dados = {
      api_id:     jogo.id,
      match_date: jogo.kickoff_utc,
      stage:      mapStage(jogo.round),
      home_team:  homeId,
      away_team:  awayId,
      home_score: jogo.home_score ?? null,
      away_score: jogo.away_score ?? null,
      status:     jogo.status ? jogo.status.toUpperCase() : null,
    };

    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('api_id', jogo.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('matches')
        .update(dados)
        .eq('api_id', jogo.id);
      if (error) { erros++; } else { atualizados++; }
    } else {
      const { error } = await supabase
        .from('matches')
        .insert(dados);
      if (error) { erros++; } else { criados++; }
    }
  }

  console.log('\n📊 Seed concluído:');
  console.log(`   ✅ Criados:     ${criados}`);
  console.log(`   🔄 Atualizados: ${atualizados}`);
  console.log(`   ⚠️  Sem time:   ${semTime} (mata-mata a definir)`);
  console.log(`   ❌ Erros:       ${erros}`);
}

seed().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});