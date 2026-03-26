import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 1. COLE A SUA CHAVE NOVA DA API-FOOTBALL AQUI (ENTRE AS ASPAS):
const API_KEY = '740d8f95c9f6ec08f8636c8d311096b3';

console.log('🤖 Robô Oficial (API-Sports Direta) entrou em campo para o 2º Tempo!');

async function buscarGols() {
  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Consultando a API Oficial...`);
  
  try {
    // Busca os jogos de hoje (usando a data do Brasil)
    const hoje = new Date().toLocaleString("en-CA", {timeZone: "America/Sao_Paulo"}).split(',')[0];
    
    const resposta = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoje}`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    const dados = await resposta.json();

    if (dados.errors && Object.keys(dados.errors).length > 0) {
      console.log('❌ A API retornou um erro:', dados.errors);
      return;
    }

    const jogos = dados.response || [];

    // Procura o jogo da Turquia
    const jogoTurquia = jogos.find(j => 
      j.teams.home.name.includes('Turkey') || 
      j.teams.away.name.includes('Turkey') ||
      j.teams.home.name.includes('Türkiye')
    );

    if (jogoTurquia) {
      const homeScore = jogoTurquia.goals.home ?? 0;
      const awayScore = jogoTurquia.goals.away ?? 0;
      // O status da API-Sports vem em .fixture.status.short (ex: 1H, HT, 2H, FT)
      const status = jogoTurquia.fixture.status.short; 

      console.log(`⚽ Turquia ${homeScore} x ${awayScore} Romênia (Status: ${status})`);

      // Se o jogo não estiver "Não Iniciado" (NS) nem "Cancelado" (CANC)
      if (status !== 'NS' && status !== 'CANC') {
        
        // Vamos converter o status da API para o nosso banco ("inprogress", "halftime", "finished")
        let statusBanco = 'inprogress';
        if (status === 'HT') statusBanco = 'halftime';
        if (status === 'FT' || status === 'AET' || status === 'PEN') statusBanco = 'finished';

        const { error } = await supabase
          .from('matches')
          .update({ 
            home_score: homeScore, 
            away_score: awayScore,
            status: statusBanco
          })
          .eq('home_team', 'tur');
          
        if (!error) {
           console.log('✅ Banco atualizado com sucesso!');
        } else {
           console.log('❌ Erro no banco:', error.message);
        }
      } else {
        console.log('⏳ Jogo ainda não começou ou foi cancelado.');
      }
    } else {
      console.log('⚠️ Jogo da Turquia não encontrado na lista oficial.');
    }

  } catch (erro) {
    console.error('❌ Erro de conexão:', erro.message);
  }
}

// Roda a primeira vez agora
buscarGols();

// Configurado para checar a cada 4 minutos (240.000 ms)
// Assim os 100 créditos duram o dia inteirinho sem bloqueios!
setInterval(buscarGols, 240000);