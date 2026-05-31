import styles from './Filters.module.css';
import type { Section, SortOption, PeopleFilter } from '../../lib/types';

interface FiltersProps {
  sections: Section[];
  activeSectionId: string;
  onSectionChange: (id: string) => void;
  peopleFilter: PeopleFilter;
  onPeopleChange: (v: PeopleFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: () => void;
}

export function Filters({
  sections,
  activeSectionId,
  onSectionChange,
  peopleFilter,
  onPeopleChange,
  sortOption,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
}: FiltersProps) {
  return (
    <div className={styles.wrap}>
      {/* Filtro por seção */}
      <div className={styles.row}>
        <button
          className={`${styles.pill} ${activeSectionId === 'all' ? styles.active : ''}`}
          onClick={() => onSectionChange('all')}
        >
          Todos
        </button>
        {sections.map(s => (
          <button
            key={s.id}
            className={`${styles.pill} ${activeSectionId === s.id ? styles.active : ''}`}
            onClick={() => onSectionChange(s.id)}
          >
            {s.icon} {s.name}
          </button>
        ))}
        <button
          className={`${styles.pill} ${showFavoritesOnly ? styles.active : ''}`}
          onClick={onFavoritesToggle}
          style={{ marginLeft: 'auto' }}
        >
          ❤️ Favoritos
        </button>
      </div>

      {/* Filtro pessoas + ordenação */}
      <div className={styles.row}>
        <span className={styles.label}>Pessoas:</span>
        {(['all', '1', '2', '3', '4', '5', '6'] as PeopleFilter[]).map(v => (
          <button
            key={v}
            className={`${styles.pill} ${peopleFilter === v ? styles.active : ''}`}
            onClick={() => onPeopleChange(v)}
          >
            {v === 'all' ? 'Todos' : `${v} ${v === '1' ? 'pessoa' : 'pessoas'}`}
          </button>
        ))}

        <div className={styles.sortRow}>
          <span className={styles.label}>Ordenar:</span>
          <select
            className={styles.sortSelect}
            value={sortOption}
            onChange={e => onSortChange(e.target.value as SortOption)}
          >
            <option value="recent">Mais recentes</option>
            <option value="copies">Mais copiados</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
