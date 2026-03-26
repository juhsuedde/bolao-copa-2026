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
    status: string;
  };
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const matchDate = new Date(match.match_date);
  const now = new Date();
  
  const apiStatus = match.status?.toLowerCase() || '';
  
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

  const showScore = isLive || isFinished || match.home_score !== null;

  return (
    <div className={`p-4 rounded-lg border ${isLive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-gray-500">
          {isLive ? (
            <span className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
              Ao Vivo
            </span>
          ) : isFinished ? (
            'Encerrado'
          ) : (
            format(matchDate, "dd 'de' MMMM", { locale: ptBR })
          )}
        </span>
        {!isFinished && !isLive && (
          <span className="text-xs text-gray-400">
            {format(matchDate, 'HH:mm')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center w-1/3">
          <img 
            src={`https://raw.githubusercontent.com/lucas-m-p/world-cup-flags/main/flags/${match.home_team}.png`}
            alt={match.home_team}
            className="w-10 h-10 mb-2 shadow-sm object-cover rounded-sm"
          />
          <span className="text-sm font-semibold uppercase">{match.home_team}</span>
        </div>

        <div className="flex items-center justify-center w-1/3">
          {showScore ? (
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold">{match.home_score ?? 0}</span>
              <span className="text-gray-400 font-light">x</span>
              <span className="text-2xl font-bold">{match.away_score ?? 0}</span>
            </div>
          ) : (
            <span className="text-xl font-light text-gray-300 italic">VS</span>
          )}
        </div>

        <div className="flex flex-col items-center w-1/3">
          <img 
            src={`https://raw.githubusercontent.com/lucas-m-p/world-cup-flags/main/flags/${match.away_team}.png`}
            alt={match.away_team}
            className="w-10 h-10 mb-2 shadow-sm object-cover rounded-sm"
          />
          <span className="text-sm font-semibold uppercase">{match.away_team}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;