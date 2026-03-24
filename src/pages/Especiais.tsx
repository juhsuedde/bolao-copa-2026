import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalEspeciais from '../components/ModalEspeciais';

type Team = { id: string; name: string; group_letter: string; flag_url: string };
type SpecialPick = { pick_category: string; team_id: string | null; pick_text: string | null };

const ALL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function Especiais() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Record<string, SpecialPick>>({});
  const [loading, setLoading] = useState(true);

  // Estado para controlar se o card dos grupos está expandido ou recolhido
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    mode: 'team' as 'team' | 'text',
    category: '',
    currentSelection: '',
    filterGroup: null as string | null
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, group_name, flag_url')
        .order('name');
        
      if (teamsError) console.error("Erro ao buscar times:", teamsError);
      
      if (teamsData) {
        const formattedTeams = teamsData.map(t => ({
          id: t.id,
          name: t.name,
          group_letter: t.group_name,
          flag_url: t.flag_url
        }));
        setTeams(formattedTeams);
      }
      
      const { data: picksData, error: picksError } = await supabase
        .from('special_picks')
        .select('pick_category, team_id, pick_text')
        .eq('user_id', user.id);
        
      if (picksError) console.error("Erro ao buscar palpites:", picksError);
      
      if (picksData) {
        const picksMap: Record<string, SpecialPick> = {};
        picksData.forEach(pick => { picksMap[pick.pick_category] = pick; });
        setPicks(picksMap);
      }
    } catch (err) {
      console.error("Erro geral na busca:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (title: string, category: string, mode: 'team' | 'text', filterGroup: string | null = null) => {
    const currentPick = picks[category];
    const currentSelection = mode === 'team' ? currentPick?.team_id || '' : currentPick?.pick_text || '';
    setModalConfig({ title, category, mode, currentSelection, filterGroup });
    setIsModalOpen(true);
  };

  const handleSavePick = async (value: string) => {
    if (!user) return;
    const { error } = await supabase.from('special_picks').upsert({
      user_id: user.id,
      pick_category: modalConfig.category,
      team_id: modalConfig.mode === 'team' ? value : null,
      pick_text: modalConfig.mode === 'text' ? value : null,
    }, { onConflict: 'user_id,pick_category' });
    if (error) { alert(error.message); return; }
    fetchData();
  };

  const getTeamName = (categoryId: string) => {
    const teamId = picks[categoryId]?.team_id;
    return teams.find(t => t.id === teamId)?.name || null;
  };

  const renderTeamFlag = (teamName: string | null) => {
    const team = teams.find(t => t.name === teamName);
    if (team?.flag_url) {
      return (
        <img 
          src={team.flag_url} 
          alt={teamName || 'Bandeira'} 
          className="w-6 h-4 object-cover rounded shadow-sm border border-bolao-border" 
          style={{ width: '24px', height: '16px' }}
        />
      );
    }
    return <span style={{ opacity: 0.3, fontSize: '16px' }}>?</span>;
  };

  const getGroupPoints = (grupo: string) => {
    const pick1 = picks[`group_${grupo.toLowerCase()}_1`];
    const pick2 = picks[`group_${grupo.toLowerCase()}_2`];
    if (pick1?.team_id && pick2?.team_id) return '+6';
    if (pick1?.team_id || pick2?.team_id) return '+2';
    return 'em andamento';
  };

  const getStatusBadge = (teamName: string | null) => {
    if (!teamName) return { text: '–', className: 'gpb pend' };
    return { text: '?', className: 'gpb pend' };
  };

  if (loading) return <div className="p-10 text-center uppercase font-display text-xs tracking-widest text-bolao-muted">Carregando...</div>;

  return (
    <div className="flex flex-col gap-5 pb-24">
      
      {/* Header da página */}
      <div className="screen-header" style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg)' }}>
        <div className="screen-title" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '30px', letterSpacing: '1px', lineHeight: 1 }}>Especiais</div>
        <div className="hchip gold" style={{ 
          fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.04em',
          background: 'var(--gold-light)', border: '1px solid var(--gold-border)', color: 'var(--gold)' 
        }}>fecha em 2d 14h</div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: '16px' }}>
        <div className="esplist" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '9px' }}>

          {/* --- CLASSIFICADOS POR GRUPO --- */}
          <div className="ecard" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            
            {/* Header do card (Clicável para expandir/recolher) */}
            <div 
              className="ecard-h" 
              onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px 9px', cursor: 'pointer' }}
            >
              <div>
                <div className="ecard-t" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Times classificados por grupo
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>até 72 pts · 6 pts por grupo exato</div>
              </div>
              
              {/* Seta indicadora (Dropdown Toggle) */}
              <div style={{ padding: '4px' }}>
                <svg className={`w-4 h-4 text-bolao-muted transform transition-transform ${isGroupsExpanded ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Conteúdo dos grupos (Visível apenas se expandido) */}
            {isGroupsExpanded && (
              <div className="gcont" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {ALL_GROUPS.map(grupo => {
                  const team1Name = getTeamName(`group_${grupo.toLowerCase()}_1`);
                  const team2Name = getTeamName(`group_${grupo.toLowerCase()}_2`);
                  const points = getGroupPoints(grupo);
                  const status1 = getStatusBadge(team1Name);
                  const status2 = getStatusBadge(team2Name);

                  return (
                    <div key={grupo} className="gmini" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <div className="gmini-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                        <div className="gml" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '15px', color: 'var(--green)' }}>Grupo {grupo}</div>
                        <div className="gmp" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                          {points.includes('+') ? (
                            <><strong style={{ fontFamily: 'DM Mono, monospace', color: 'var(--gold)' }}>{points}</strong> pts</>
                          ) : points}
                        </div>
                      </div>

                      <div className="gprow" onClick={() => openModal(`1º do Grupo ${grupo}`, `group_${grupo.toLowerCase()}_1`, 'team', grupo)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer' }}>
                        <div className="gpf" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                          {renderTeamFlag(team1Name)}
                        </div>
                        <div className="gpn" style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: team1Name ? 'var(--text)' : 'var(--muted)' }}>
                          {team1Name || 'Selecionar'}
                        </div>
                        <div className={status1.className} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: 'var(--bg3)', color: 'var(--muted)' }}>
                          {status1.text}
                        </div>
                      </div>

                      <div className="gprow" onClick={() => openModal(`2º do Grupo ${grupo}`, `group_${grupo.toLowerCase()}_2`, 'team', grupo)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer' }}>
                        <div className="gpf" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                          {renderTeamFlag(team2Name)}
                        </div>
                        <div className="gpn" style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: team2Name ? 'var(--text)' : 'var(--muted)' }}>
                          {team2Name || 'Selecionar'}
                        </div>
                        <div className={status2.className} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', background: 'var(--bg3)', color: 'var(--muted)' }}>
                          {status2.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- TIMES NA FINAL --- */}
          <div className="ecard" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div className="ecard-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px 9px' }}>
              <div className="ecard-t" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Times na Final</div>
              <div className="epts" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-light)', border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '20px' }}>até 10 pts</div>
            </div>
            
            <div className="epick" onClick={() => openModal('Finalista 1', 'finalist_1', 'team')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <div className="eflag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                {getTeamName('finalist_1') ? renderTeamFlag(getTeamName('finalist_1')) : '🏆'}
              </div>
              <div className="einfo" style={{ flex: 1 }}>
                <div className="ename" style={{ fontSize: '14px', fontWeight: 500, color: getTeamName('finalist_1') ? 'var(--text)' : 'var(--muted)' }}>
                  {getTeamName('finalist_1') || 'Selecionar 1º finalista'}
                </div>
                <div className="esub" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                  {getTeamName('finalist_1') ? '1º finalista' : 'Clique para escolher'}
                </div>
              </div>
              <div className="eact" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                {getTeamName('finalist_1') ? 'Trocar' : '+ Escolher'}
              </div>
            </div>

            <div className="epick" onClick={() => openModal('Finalista 2', 'finalist_2', 'team')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderTop: '1px solid var(--border)', cursor: 'pointer', opacity: getTeamName('finalist_1') ? 1 : 0.6 }}>
              <div className="eflag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', opacity: getTeamName('finalist_2') ? 1 : 0.28 }}>
                {getTeamName('finalist_2') ? renderTeamFlag(getTeamName('finalist_2')) : '🏆'}
              </div>
              <div className="einfo" style={{ flex: 1 }}>
                <div className="ename" style={{ fontSize: '14px', fontWeight: 500, color: getTeamName('finalist_2') ? 'var(--text)' : 'var(--muted)' }}>
                  {getTeamName('finalist_2') || 'Selecionar 2º finalista'}
                </div>
                <div className="esub" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                  {getTeamName('finalist_2') ? '2º finalista' : 'Clique para escolher'}
                </div>
              </div>
              <div className="eact" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                {getTeamName('finalist_2') ? 'Trocar' : '+ Escolher'}
              </div>
            </div>
          </div>

          {/* --- CAMPEÃO --- */}
          <div className="ecard" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div className="ecard-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px 9px' }}>
              <div className="ecard-t" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campeão da Copa</div>
              <div className="epts" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-light)', border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '20px' }}>15 pts</div>
            </div>
            <div className="epick" onClick={() => openModal('Campeão da Copa', 'champion', 'team')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <div className="eflag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                {getTeamName('champion') ? renderTeamFlag(getTeamName('champion')) : '🥇'}
              </div>
              <div className="einfo" style={{ flex: 1 }}>
                <div className="ename" style={{ fontSize: '14px', fontWeight: 500, color: getTeamName('champion') ? 'var(--text)' : 'var(--muted)' }}>
                  {getTeamName('champion') || 'Quem leva a taça?'}
                </div>
                <div className="esub" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                  {getTeamName('champion') ? 'Seu palpite' : 'Clique para escolher'}
                </div>
              </div>
              <div className="eact" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                {getTeamName('champion') ? 'Trocar' : '+ Escolher'}
              </div>
            </div>
          </div>

          {/* --- ARTILHEIRO --- */}
          <div className="ecard" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div className="ecard-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px 9px' }}>
              <div className="ecard-t" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Artilheiro da Copa</div>
              <div className="epts" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-light)', border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '20px' }}>10 pts</div>
            </div>
            <div className="epick" onClick={() => openModal('Artilheiro da Copa', 'top_scorer', 'text')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <div className="eflag" style={{ fontSize: '21px' }}>⚽</div>
              <div className="einfo" style={{ flex: 1 }}>
                <div className="ename" style={{ fontSize: '14px', fontWeight: 500, color: picks['top_scorer']?.pick_text ? 'var(--text)' : 'var(--muted)' }}>
                  {picks['top_scorer']?.pick_text || 'Nome do jogador'}
                </div>
                <div className="esub" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
              {picks['top_scorer']?.pick_text ? 'Seu palpite' : 'Digite o nome do artilheiro'}
                </div>
              </div>
              <div className="eact" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                {picks['top_scorer']?.pick_text ? 'Trocar' : '+ Escolher'}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ModalEspeciais 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalConfig.title}
        mode={modalConfig.mode} 
        teams={
          modalConfig.filterGroup 
            ? teams.filter(t => t.group_letter === modalConfig.filterGroup) 
            : teams
        }
        currentSelection={modalConfig.currentSelection} 
        onSave={handleSavePick}
      />
    </div>
  );
}