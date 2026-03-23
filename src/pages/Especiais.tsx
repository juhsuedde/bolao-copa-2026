import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalEspeciais from '../components/ModalEspeciais';

type Team = { id: string; name: string; group_letter: string };
type SpecialPick = { pick_category: string; team_id: string | null; pick_text: string | null };

export default function Especiais() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Record<string, SpecialPick>>({});
  const [loading, setLoading] = useState(true);

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    mode: 'team' as 'team' | 'text',
    category: '',
    currentSelection: '',
    filterGroup: null as string | null // <-- Propriedade do filtro adicionada aqui
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Busca todas as seleções para o modal
    const { data: teamsData } = await supabase.from('teams').select('id, name, group_letter').order('name');
    if (teamsData) setTeams(teamsData);

    // Busca os palpites já feitos pelo usuário
    const { data: picksData } = await supabase
      .from('special_picks')
      .select('pick_category, team_id, pick_text')
      .eq('user_id', user.id);

    if (picksData) {
      const picksMap: Record<string, SpecialPick> = {};
      picksData.forEach(pick => {
        picksMap[pick.pick_category] = pick;
      });
      setPicks(picksMap);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para abrir o modal configurado para a categoria certa (agora recebe o filtro de grupo)
  const openModal = (title: string, category: string, mode: 'team' | 'text', filterGroup: string | null = null) => {
    const currentPick = picks[category];
    const currentSelection = mode === 'team' ? currentPick?.team_id || '' : currentPick?.pick_text || '';
    
    setModalConfig({ title, category, mode, currentSelection, filterGroup });
    setIsModalOpen(true);
  };

  // Salva o palpite no Supabase com tratamento de erros visível
  const handleSavePick = async (value: string) => {
    if (!user) return;
    
    const pickData = {
      user_id: user.id,
      pick_category: modalConfig.category,
      team_id: modalConfig.mode === 'team' ? value : null,
      pick_text: modalConfig.mode === 'text' ? value : null,
    };

    // Tenta salvar e "captura" qualquer erro
    const { error } = await supabase
      .from('special_picks')
      .upsert(pickData, { onConflict: 'user_id,pick_category' });
    
    // Se der erro no banco, o navegador vai dar um alerta vermelho
    if (error) {
      console.error("Erro do Supabase:", error);
      alert("Ops! Erro ao salvar: " + error.message);
      return;
    }
    
    // Se deu certo, recarrega os dados para atualizar a tela
    fetchData();
  };

  // Função auxiliar para pegar o nome do time selecionado
  const getTeamName = (categoryId: string) => {
    const teamId = picks[categoryId]?.team_id;
    if (!teamId) return null;
    return teams.find(t => t.id === teamId)?.name || 'Time desconhecido';
  };

  const grupos = ['A', 'B', 'C', 'D'];

  if (loading) {
    return <div className="p-6 text-bolao-muted flex justify-center mt-10">Carregando especiais...</div>;
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      
      {/* Cabeçalho */}
      <div className="px-5 pt-5 flex items-center justify-between bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Especiais</h1>
        <div className="text-[11px] font-semibold bg-bolao-gold-light text-bolao-gold px-3 py-1 rounded-full border border-bolao-gold/30">
          fecha no 1º jogo
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* CLASSIFICADOS POR GRUPO (GRID 2 COLUNAS) */}
        <div className="flex flex-col gap-2">
          <div className="px-1">
            <div className="text-[11px] font-semibold text-bolao-muted tracking-widest uppercase">
              Classificados por grupo
            </div>
            <div className="text-[10px] text-bolao-muted mt-0.5">
              até 72 pts · 2 pts por seleção
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {grupos.map(grupo => (
              <div key={grupo} className="bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 border-b border-bolao-border">
                  <div className="font-display text-[15px] text-bolao-green tracking-wide">Grupo {grupo}</div>
                </div>
                <div className="flex flex-col">
                  {/* 1º Classificado (passando a letra do grupo como 4º argumento) */}
                  <div 
                    onClick={() => openModal(`1º do Grupo ${grupo}`, `group_${grupo.toLowerCase()}_1`, 'team', grupo)}
                    className="flex items-center gap-2 px-3 py-2 border-b border-bolao-border/50 active:bg-bolao-bg cursor-pointer"
                  >
                    <div className="text-sm opacity-30">{getTeamName(`group_${grupo.toLowerCase()}_1`) ? '✅' : '?'}</div>
                    <div className={`flex-1 text-[10px] font-medium truncate ${getTeamName(`group_${grupo.toLowerCase()}_1`) ? 'text-bolao-green font-bold' : 'text-bolao-muted'}`}>
                      {getTeamName(`group_${grupo.toLowerCase()}_1`) || '1º classificado'}
                    </div>
                  </div>
                  {/* 2º Classificado (passando a letra do grupo como 4º argumento) */}
                  <div 
                    onClick={() => openModal(`2º do Grupo ${grupo}`, `group_${grupo.toLowerCase()}_2`, 'team', grupo)}
                    className="flex items-center gap-2 px-3 py-2 active:bg-bolao-bg cursor-pointer"
                  >
                    <div className="text-sm opacity-30">{getTeamName(`group_${grupo.toLowerCase()}_2`) ? '✅' : '?'}</div>
                    <div className={`flex-1 text-[10px] font-medium truncate ${getTeamName(`group_${grupo.toLowerCase()}_2`) ? 'text-bolao-green font-bold' : 'text-bolao-muted'}`}>
                      {getTeamName(`group_${grupo.toLowerCase()}_2`) || '2º classificado'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OUTROS PALPITES ESPECIAIS */}
        <div className="flex flex-col gap-3 mt-2">

          {/* TIMES NA FINAL */}
          <div 
            onClick={() => openModal('Finalista 1', 'finalist_1', 'team')}
            className="bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden flex items-center p-3.5 active:bg-bolao-bg cursor-pointer transition-colors shadow-sm"
          >
            <div className="text-3xl opacity-40 mr-4">🏆</div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-bolao-muted tracking-widest uppercase mb-0.5">Finalista 1</div>
              <div className={`text-[13px] font-medium ${getTeamName('finalist_1') ? 'text-bolao-green' : 'text-bolao-text'}`}>
                {getTeamName('finalist_1') || 'Selecionar seleção'}
              </div>
            </div>
          </div>

          <div 
            onClick={() => openModal('Finalista 2', 'finalist_2', 'team')}
            className="bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden flex items-center p-3.5 active:bg-bolao-bg cursor-pointer transition-colors shadow-sm"
          >
            <div className="text-3xl opacity-40 mr-4">🏆</div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-bolao-muted tracking-widest uppercase mb-0.5">Finalista 2</div>
              <div className={`text-[13px] font-medium ${getTeamName('finalist_2') ? 'text-bolao-green' : 'text-bolao-text'}`}>
                {getTeamName('finalist_2') || 'Selecionar seleção'}
              </div>
            </div>
          </div>

          {/* CAMPEÃO */}
          <div 
            onClick={() => openModal('Campeão da Copa', 'champion', 'team')}
            className="bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden flex items-center p-3.5 active:bg-bolao-bg cursor-pointer transition-colors shadow-sm"
          >
            <div className="text-3xl opacity-40 mr-4">🥇</div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-bolao-muted tracking-widest uppercase mb-0.5">Campeão</div>
              <div className={`text-[13px] font-medium ${getTeamName('champion') ? 'text-bolao-green font-bold' : 'text-bolao-text'}`}>
                {getTeamName('champion') || 'Quem leva a taça?'}
              </div>
            </div>
            <div className="font-mono text-[11px] text-bolao-gold bg-bolao-gold-light border border-bolao-gold/30 px-2 py-0.5 rounded-full">15 pts</div>
          </div>

          {/* ARTILHEIRO */}
          <div 
            onClick={() => openModal('Artilheiro da Copa', 'top_scorer', 'text')}
            className="bg-bolao-bg-card border border-bolao-border rounded-xl overflow-hidden flex items-center p-3.5 active:bg-bolao-bg cursor-pointer transition-colors shadow-sm"
          >
            <div className="text-3xl opacity-40 mr-4">⚽</div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-bolao-muted tracking-widest uppercase mb-0.5">Artilheiro</div>
              <div className={`text-[13px] font-medium ${picks['top_scorer']?.pick_text ? 'text-bolao-green font-bold' : 'text-bolao-text'}`}>
                {picks['top_scorer']?.pick_text || 'Nome do jogador'}
              </div>
            </div>
            <div className="font-mono text-[11px] text-bolao-gold bg-bolao-gold-light border border-bolao-gold/30 px-2 py-0.5 rounded-full">10 pts</div>
          </div>

        </div>

      </div>

      {/* Renderiza o modal inteligente com a lógica do filtro */}
      <ModalEspeciais 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig.title}
        mode={modalConfig.mode}
        teams={modalConfig.filterGroup ? teams.filter(t => t.group_letter === modalConfig.filterGroup) : teams}
        currentSelection={modalConfig.currentSelection}
        onSave={handleSavePick}
      />

    </div>
  );
}