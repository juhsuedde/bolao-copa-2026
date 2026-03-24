type Team = { id: string; name: string; group_letter: string; flag_url?: string };

type ModalEspeciaisProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mode: 'team' | 'text';
  teams: Team[];
  currentSelection: string;
  onSave: (value: string) => void;
};

const TOP_SCORERS = [
  'Kylian Mbappé (França)',
  'Vinícius Júnior (Brasil)',
  'Harry Kane (Inglaterra)',
  'Jude Bellingham (Inglaterra)',
  'Erling Haaland (Noruega)',
  'Lionel Messi (Argentina)',
  'Jamal Musiala (Alemanha)',
  'Julian Alvarez (Argentina)',
  'Rodrygo (Brasil)',
  'Bukayo Saka (Inglaterra)',
  'Rafael Leão (Portugal)',
  'Cristiano Ronaldo (Portugal)',
  'Kevin De Bruyne (Bélgica)',
  'Romelu Lukaku (Bélgica)',
  'Lautaro Martínez (Argentina)',
  'Lamine Yamal (Espanha)',
  'Outro Jogador'
];

export default function ModalEspeciais({ isOpen, onClose, title, mode, teams, currentSelection, onSave }: ModalEspeciaisProps) {
  
  if (!isOpen) return null;

  const handleSelect = (value: string) => {
    onSave(value);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-bolao-text/60 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform">
        <div className="bg-bolao-bg rounded-t-3xl pt-2 px-5 pb-8 shadow-2xl relative max-h-[90vh] flex flex-col">
          
          {/* Tracinho superior */}
          <div className="w-12 h-1 bg-bolao-border rounded-full mx-auto mb-6 opacity-60 flex-shrink-0" />

          {/* Cabeçalho do Modal */}
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-sm font-display uppercase tracking-widest text-bolao-text">
              {title}
            </h2>
            <button onClick={onClose} className="p-2 -mr-2 text-bolao-muted hover:text-bolao-text">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista Rolável de Opções (Sem Barra de Busca) */}
          <div className="overflow-y-auto flex-1 min-h-[200px] max-h-[60vh] pr-1">
            
            {/* MODO SELEÇÃO DE TIME */}
            {mode === 'team' && (
              <div className="flex flex-col gap-2">
                {teams.length === 0 ? (
                  <div className="text-center text-bolao-muted text-xs py-4">
                    Nenhuma seleção encontrada no banco de dados para esta categoria.
                  </div>
                ) : (
                  teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleSelect(team.id)}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                        currentSelection === team.id 
                          ? 'bg-bolao-green-light border-bolao-green-mid' 
                          : 'bg-bolao-bg-card border-bolao-border hover:bg-gray-50'
                      }`}
                    >
                      {/* Bandeira */}
                      <div className="w-8 h-6 flex items-center justify-center flex-shrink-0">
                        {team.flag_url ? (
                          <img src={team.flag_url} alt={team.name} className="w-full h-full object-cover rounded shadow-sm border border-bolao-border" />
                        ) : (
                          <span className="text-xl opacity-30">?</span>
                        )}
                      </div>
                      
                      {/* Nome do Time */}
                      <span className={`text-sm font-medium ${currentSelection === team.id ? 'text-bolao-green' : 'text-bolao-text'}`}>
                        {team.name}
                      </span>
                      
                      {/* Checkmark de selecionado */}
                      {currentSelection === team.id && (
                         <div className="ml-auto text-bolao-green">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                           </svg>
                         </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* MODO SELEÇÃO DE JOGADOR (ARTILHEIRO) */}
            {mode === 'text' && (
              <div className="flex flex-col gap-2">
                {TOP_SCORERS.map(scorer => (
                  <button
                    key={scorer}
                    onClick={() => handleSelect(scorer)}
                    className={`flex items-center p-3 rounded-xl border transition-colors ${
                      currentSelection === scorer 
                        ? 'bg-bolao-green-light border-bolao-green-mid' 
                        : 'bg-bolao-bg-card border-bolao-border hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${currentSelection === scorer ? 'text-bolao-green' : 'text-bolao-text'}`}>
                      {scorer}
                    </span>
                    
                    {/* Checkmark de selecionado */}
                    {currentSelection === scorer && (
                       <div className="ml-auto text-bolao-green">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                         </svg>
                       </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
          </div>
          
        </div>
      </div>
    </>
  );
}