import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchCardProps {
  match: {
    id: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string;
    status?: string | null; // O '?' e o 'null' resolvem o erro do MatchDayGroup
  };
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const matchDate = new Date(match.match_date);
  
  // Convertemos para minúsculo e garantimos que nunca seja undefined
  const apiStatus = (match.status || '').toLowerCase();
  
  const isLive = 
    apiStatus === 'inprogress' || 
    apiStatus === '1h' || 
    apiStatus === '2h' || 
    apiStatus === 'ht' || 
    apiStatus === 'halftime';

  const isFinished = 
    apiStatus === 'finished' || 
    apiStatus === 'ft' || 
    apiStatus === 'aet' || 
    apiStatus === 'pen';

  // Se estiver ao vivo ou finalizado, mostramos o placar. Caso contrário, mostramos VS.
  const showScore = isLive || isFinished;

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${isLive ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-gray-100 bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5 animate-pulse" />
              Ao Vivo
            </span>
          ) : isFinished ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Encerrado
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
              {format(matchDate, "dd 'de' MMM", { locale: ptBR })}
            </span>
          )}
        </div>
        {!isFinished && !isLive && (
          <span className="text-xs font-medium text-gray-400">
            {format(matchDate, 'HH:mm')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center flex-1">
          <img 
            src={`https://raw.githubusercontent.com/lucas-m-p/world-cup-flags/main/flags/${match.home_team.toLowerCase()}.png`}
            alt={match.home_team}
            className="w-10 h-7 object-cover rounded shadow-sm mb-2"
          />
          <span className="text-xs font-bold uppercase tracking-tight text-gray-700">{match.home_team}</span>
        </div>

        <div className="flex items-center justify-center flex-1">
          {showScore ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-gray-800">{match.home_score ?? 0}</span>
              <span className="text-gray-300 font-light">-</span>
              <span className="text-3xl font-black text-gray-800">{match.away_score ?? 0}</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-md bg-gray-50 border border-gray-100">
              <span className="text-xs font-black text-gray-300">VS</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center flex-1">
          <img 
            src={`https://raw.githubusercontent.com/lucas-m-p/world-cup-flags/main/flags/${match.away_team.toLowerCase()}.png`}
            alt={match.away_team}
            className="w-10 h-7 object-cover rounded shadow-sm mb-2"
          />
          <span className="text-xs font-bold uppercase tracking-tight text-gray-700">{match.away_team}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;