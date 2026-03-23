import { useState, useEffect } from 'react';

type Team = { id: string; name: string; group_letter: string };

interface ModalEspeciaisProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mode: 'team' | 'text';
  teams?: Team[];
  currentSelection?: string; // ID do time ou nome do jogador já salvo
  onSave: (value: string) => void;
}

export default function ModalEspeciais({ 
  isOpen, onClose, title, mode, teams = [], currentSelection, onSave 
}: ModalEspeciaisProps) {
  
  const [inputText, setInputText] = useState('');

  // Preenche o campo de texto caso já exista um artilheiro salvo
  useEffect(() => {
    if (isOpen && mode === 'text') {
      setInputText(currentSelection || '');
    }
  }, [isOpen, mode, currentSelection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col justify-end z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-bolao-bg-card rounded-t-[24px] border border-bolao-border border-b-0 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-bolao-border rounded-full mx-auto mt-3 mb-4 shrink-0"></div>
        <h2 className="font-display text-xl tracking-wide px-5 text-bolao-text mb-4 shrink-0">{title}</h2>

        {mode === 'team' ? (
          /* MODO SELEÇÃO DE TIME */
          <div className="overflow-y-auto px-5 pb-5 flex flex-col gap-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => { onSave(team.id); onClose(); }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  currentSelection === team.id 
                    ? 'bg-bolao-green-light border-bolao-green-mid' 
                    : 'bg-bolao-bg border-bolao-border active:bg-gray-100'
                }`}
              >
                <span className="font-medium text-sm">{team.name}</span>
                <span className="text-[10px] text-bolao-muted font-bold tracking-wider uppercase">
                  Grupo {team.group_letter}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* MODO TEXTO (ARTILHEIRO) */
          <div className="px-5 pb-5">
            <input 
              type="text"
              autoFocus
              placeholder="Ex: Mbappé, Vini Jr..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-bolao-bg border border-bolao-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-bolao-green mb-4"
            />
            <button 
              onClick={() => { onSave(inputText); onClose(); }}
              className="w-full h-12 bg-bolao-green text-white text-[15px] font-semibold rounded-xl tracking-wide active:opacity-80 transition-opacity"
            >
              Salvar palpite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}