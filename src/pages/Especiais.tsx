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
    'Coreia do Norte': 'PRK',
    'Nova Zelândia': 'NZL',
    'África do Sul': 'RSA',
  };
  if (overrides[name]) return overrides[name];
  const clean = name.replace(/^(da |de |do |das |dos |the )/i, '');
  return clean.slice(0, 3).toUpperCase();
}

// Função auxiliar para calcular o tempo restante
function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return '';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function Especiais() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<Record<string, SpecialPick>>({});
  const [loading, setLoading] = useState(true);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [firstMatchDate, setFirstMatchDate] = useState<Date | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    mode: 'team' as 'team' | 'text',
    category: '',
    currentSelection: '',
    filterGroup: null as string | null,
  });

  // Atualiza o chip de prazo a cada minuto se a data do primeiro jogo já foi carregada
  useEffect(() => {
    if (!firstMatchDate) return;
    
    const update = () => setDeadline(timeUntil(firstMatchDate));
    update(); // Chamada inicial
    
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [firstMatchDate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Busca os times e ignora os placeholders do mata-mata (group_name = '-')
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, group_name, flag_url')
        .neq('group_name', '-') // Esconde o mata-mata dos modais de grupos
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

      // 2. Busca os palpites especiais do usuário
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

      // 3. Busca a data do primeiro jogo para o countdown
      const { data: firstMatchData } = await supabase
        .from('matches')
        .select('match_date')
        .order('match_date', { ascending: true })
        .limit(1)
        .single();
        
      if (firstMatchData?.match_date) {
        setFirstMatchDate(new Date(firstMatchData.match_date));
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

  const getGroupPickStatus = (_teamId: string | null | undefined): 'ok' | 'no' | 'pend' | 'add' => {
    if (!_teamId) return 'add';
    return 'pend';
  };

  const getGroupPts = (grupo: string) => {
    const p1 = picks[`group_${grupo.toLowerCase()}_1`];
    const p2 = picks[`group_${grupo.toLowerCase()}_2`];
    if (p1?.team_id && p2?.team_id) return { value: '+6', hasValue: true };
    if (p1?.team_id || p2?.team_id) return { value: '+2', hasValue: true };
    return { value: '--', hasValue: false };
  };

  // Chip de prazo: mostra contagem regressiva antes da Copa, some depois
  const isBeforeCopa = firstMatchDate ? new Date() < firstMatchDate : false;
  const deadlineChip = isBeforeCopa && deadline
    ? `fecha em ${deadline}`
    : isBeforeCopa
    ? 'em breve'
    : null;

  if (loading) return (
    <div className="p-10 text-center uppercase font-display text-xs tracking-widest text-bolao-muted">
      Carregando...
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-24">

      <div className="screen-header">
        <div className="screen-title">Especiais</div>
        {deadlineChip && <div className="hchip gold">{deadlineChip}</div>}
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
            const finalist1Chosen = !!getTeamByCategory('finalist_1');
            return (
              <div
                key={cat}
                className="epick"
                onClick={() => openModal(i === 0 ? 'Finalista 1' : 'Finalista 2', cat, 'team')}
                style={{ opacity: i === 1 && !finalist1Chosen ? 0.5 : 1 }}
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