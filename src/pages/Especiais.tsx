import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ModalEspeciais from '../components/ModalEspeciais';

type Team = { id: string; name: string; group_letter: string; flag_url: string };
type SpecialPick = { pick_category: string; team_id: string | null; pick_text: string | null };

const ALL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function abbrev(name: string | null): string {
  if (!name) return '---';
  const overrides: Record<string, string> = {
    'Estados Unidos': 'EUA',
    'Coreia do Sul': 'COR',
    'Arábia Saudita': 'SAU',
    'Costa Rica': 'CRC',
    'República Checa': 'TCH',
    'Bósnia e Herzegovina': 'BIH',
    'Trinidad e Tobago': 'TRI',
  };
  if (overrides[name]) return overrides[name];
  // Remove artigos e preposições, pega as 3 primeiras letras da primeira palavra significativa
  const clean = name.replace(/^(da |de |do |das |dos |the )/i, '');
  return clean.slice(0, 3).toUpperCase();
}

export default function Especiais() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Record<string, SpecialPick>>({});
  const [loading, setLoading] = useState(true);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    mode: 'team' as 'team' | 'text',
    category: '',
    currentSelection: '',
    filterGroup: null as string | null,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, group_name, flag_url')
        .order('name');
      if (teamsError) console.error('Erro ao buscar times:', teamsError);
      if (teamsData) {
        setTeams(teamsData.map(t => ({
          id: t.id,
          name: t.name,
          group_letter: t.group_name,
          flag_url: t.flag_url,
        })));
      }

      const { data: picksData, error: picksError } = await supabase
        .from('special_picks')
        .select('pick_category, team_id, pick_text')
        .eq('user_id', user.id);
      if (picksError) console.error('Erro ao buscar palpites:', picksError);
      if (picksData) {
        const map: Record<string, SpecialPick> = {};
        picksData.forEach(p => { map[p.pick_category] = p; });
        setPicks(map);
      }
    } catch (err) {
      console.error('Erro geral na busca:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (
    title: string,
    category: string,
    mode: 'team' | 'text',
    filterGroup: string | null = null
  ) => {
    const current = picks[category];
    const currentSelection = mode === 'team' ? current?.team_id || '' : current?.pick_text || '';
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

  const getTeamById = (teamId: string | null | undefined) =>
    teams.find(t => t.id === teamId) ?? null;

  const getTeamByCategory = (category: string) =>
    getTeamById(picks[category]?.team_id ?? null);

  // Status badge para linha de grupo: ok / no / pend / add
  const getGroupPickStatus = (teamId: string | null | undefined): 'ok' | 'no' | 'pend' | 'add' => {
    if (!teamId) return 'add';
    // Futuramente: comparar com resultado real do grupo
    // Por ora: se tem palpite, mostra pend (aguardando) ou ok/no quando resultado disponível
    return 'pend';
  };

  const getGroupPts = (grupo: string) => {
    const p1 = picks[`group_${grupo.toLowerCase()}_1`];
    const p2 = picks[`group_${grupo.toLowerCase()}_2`];
    if (p1?.team_id && p2?.team_id) return { value: '+6', hasValue: true };
    if (p1?.team_id || p2?.team_id) return { value: '+2', hasValue: true };
    return { value: '--', hasValue: false };
  };

  if (loading) return (
    <div className="p-10 text-center uppercase font-display text-xs tracking-widest text-bolao-muted">
      Carregando...
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-24">

      {/* Header */}
      <div className="screen-header">
        <div className="screen-title">Especiais</div>
        <div className="hchip gold">fecha em 2d 14h</div>
      </div>

      <div className="esplist">

        {/* ── CLASSIFICADOS POR GRUPO ─────────────────────── */}
        <div className="ecard">
          <div className="ecard-h toggle" onClick={() => setIsGroupsExpanded(v => !v)}>
            <div>
              <div className="ecard-t">Times classificados por grupo</div>
              <div className="ecard-sub">até 72 pts · 6 pts por grupo exato</div>
            </div>
            <svg
              className={`w-4 h-4 text-bolao-muted transition-transform ${isGroupsExpanded ? '' : 'rotate-180'}`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {isGroupsExpanded && (
            <div className="gcont">
              {ALL_GROUPS.map(grupo => {
                const pick1Id = picks[`group_${grupo.toLowerCase()}_1`]?.team_id ?? null;
                const pick2Id = picks[`group_${grupo.toLowerCase()}_2`]?.team_id ?? null;
                const team1 = getTeamById(pick1Id);
                const team2 = getTeamById(pick2Id);
                const pts = getGroupPts(grupo);

                return (
                  <div key={grupo} className="gmini">
                    <div className="gmini-h">
                      <div className="gml">Grupo {grupo}</div>
                      <div className="gmp">
                        {pts.hasValue ? <strong>{pts.value}</strong> : pts.value}
                      </div>
                    </div>

                    {[
                      { pos: 1, teamId: pick1Id, team: team1 },
                      { pos: 2, teamId: pick2Id, team: team2 },
                    ].map(({ pos, teamId, team }) => {
                      const status = getGroupPickStatus(teamId);
                      return (
                        <div
                          key={pos}
                          className="gprow"
                          onClick={() => openModal(
                            `${pos}º do Grupo ${grupo}`,
                            `group_${grupo.toLowerCase()}_${pos}`,
                            'team',
                            grupo
                          )}
                        >
                          <div className="gppos">{pos}º</div>

                          <div className={`gpflag ${teamId ? '' : 'empty'}`}>
                            {team?.flag_url ? (
                              <img src={team.flag_url} alt={team.name} />
                            ) : (
                              <span>?</span>
                            )}
                          </div>

                          <div className={`gpname ${teamId ? '' : 'empty'}`}>
                            {teamId ? abbrev(team?.name ?? null) : 'Sel.'}
                          </div>

                          <div className={`gpb ${status}`}>
                            {status === 'ok'   ? '✓' :
                             status === 'no'   ? '✗' :
                             status === 'pend' ? '?' : '+'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── TIMES NA FINAL ──────────────────────────────── */}
        <div className="ecard">
          <div className="ecard-h">
            <div className="ecard-t">Times na Final</div>
            <div className="epts">até 10 pts</div>
          </div>

          {(['finalist_1', 'finalist_2'] as const).map((cat, i) => {
            const team = getTeamByCategory(cat);
            const isEmpty = !team;
            return (
              <div key={cat} className="epick" onClick={() => openModal(
                i === 0 ? 'Finalista 1' : 'Finalista 2', cat, 'team'
              )}
                style={{ opacity: i === 1 && !getTeamByCategory('finalist_1') ? 0.5 : 1 }}
              >
                <div className={`eflag ${isEmpty ? 'empty' : ''}`}>
                  {team?.flag_url
                    ? <img src={team.flag_url} alt={team.name} />
                    : '🏆'}
                </div>
                <div className="einfo">
                  <div className={`ename ${isEmpty ? 'empty' : ''}`}>
                    {team?.name ?? (i === 0 ? 'Selecionar 1º finalista' : 'Selecionar 2º finalista')}
                  </div>
                  <div className="esub">
                    {team ? (i === 0 ? '1º finalista' : '2º finalista') : 'Clique para escolher'}
                  </div>
                </div>
                <div className="eact">{team ? 'Trocar' : '+ Escolher'}</div>
              </div>
            );
          })}
        </div>

        {/* ── CAMPEÃO ─────────────────────────────────────── */}
        <div className="ecard">
          <div className="ecard-h">
            <div className="ecard-t">Campeão da Copa</div>
            <div className="epts">15 pts</div>
          </div>
          <div className="epick" onClick={() => openModal('Campeão da Copa', 'champion', 'team')}>
            {(() => {
              const team = getTeamByCategory('champion');
              return (
                <>
                  <div className={`eflag ${!team ? 'empty' : ''}`}>
                    {team?.flag_url ? <img src={team.flag_url} alt={team.name} /> : '🥇'}
                  </div>
                  <div className="einfo">
                    <div className={`ename ${!team ? 'empty' : ''}`}>
                      {team?.name ?? 'Quem leva a taça?'}
                    </div>
                    <div className="esub">{team ? 'Seu palpite' : 'Clique para escolher'}</div>
                  </div>
                  <div className="eact">{team ? 'Trocar' : '+ Escolher'}</div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── ARTILHEIRO ──────────────────────────────────── */}
        <div className="ecard">
          <div className="ecard-h">
            <div className="ecard-t">Artilheiro da Copa</div>
            <div className="epts">10 pts</div>
          </div>
          <div className="epick" onClick={() => openModal('Artilheiro da Copa', 'top_scorer', 'text')}>
            <div className="eflag">⚽</div>
            <div className="einfo">
              <div className={`ename ${!picks['top_scorer']?.pick_text ? 'empty' : ''}`}>
                {picks['top_scorer']?.pick_text ?? 'Nome do jogador'}
              </div>
              <div className="esub">
                {picks['top_scorer']?.pick_text ? 'Seu palpite' : 'Digite o nome do artilheiro'}
              </div>
            </div>
            <div className="eact">
              {picks['top_scorer']?.pick_text ? 'Trocar' : '+ Escolher'}
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