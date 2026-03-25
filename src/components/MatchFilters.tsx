import type { Filter } from '../types';

interface MatchFiltersProps {
  filter: Filter;
  groupFilter: string | null;
  onFilterChange: (filter: Filter) => void;
  onGroupChange: (group: string) => void;
  availableFilters: Filter[];
  chipLabel: string;
  isGroupStageOver: boolean;
}

export default function MatchFilters({
  filter,
  groupFilter,
  onFilterChange,
  onGroupChange,
  availableFilters,
  chipLabel,
  isGroupStageOver,
}: MatchFiltersProps) {
  const filterLabel: Record<Filter, string> = {
    proximos: 'Próximos',
    hoje:     'Hoje',
    grupos:   'Grupos',
    todos:    'Todos',
  };

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-0 bg-bolao-bg">
        <h1 className="text-3xl font-display text-bolao-text tracking-wide">Jogos</h1>
        <div className="text-[11px] font-semibold bg-bolao-green-light text-bolao-green px-3 py-1 rounded-full border border-bolao-green-mid">
          {chipLabel}
        </div>
      </div>

      <div className="flex gap-[6px] px-5 pt-[10px] pb-0 overflow-x-auto no-scrollbar">
        {availableFilters.map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`flex-shrink-0 px-[13px] py-[6px] rounded-full text-[11px] font-semibold border transition-all ${
              filter === f
                ? (f === 'hoje' || f === 'proximos')
                  ? 'bg-bolao-green text-white border-bolao-green'
                  : 'bg-bolao-green-light border-bolao-green-mid text-bolao-green'
                : 'bg-bolao-bg-card border-bolao-border text-bolao-muted'
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {filter === 'grupos' && !isGroupStageOver && (
        <div className="px-5 pt-3 pb-1">
          <div className="grid grid-cols-6 gap-2">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => onGroupChange(g)}
                className={`h-9 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-all ${
                  groupFilter === g
                    ? 'bg-bolao-text text-bolao-bg border-bolao-text'
                    : 'bg-bolao-bg-card border-bolao-border text-bolao-muted'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}