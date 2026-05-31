import { useMemo } from 'react';
import { StatsBar } from '../../components/StatsBar/StatsBar';
import { Filters } from '../../components/Filters/Filters';
import { PromptCard } from '../../components/PromptCard/PromptCard';
import { SkeletonGrid } from '../../components/Skeleton/Skeleton';
import { MobileSearch } from '../../components/MobileSearch/MobileSearch';
import styles from './LibraryPage.module.css';
import type { Prompt, Section, SortOption, PeopleFilter } from '../../lib/types';

interface LibraryPageProps {
  prompts: Prompt[];
  sections: Section[];
  loading: boolean;
  activeSectionId: string;
  onSectionChange: (id: string) => void;
  peopleFilter: PeopleFilter;
  onPeopleChange: (v: PeopleFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  copiedToday: number;
  favorites: Set<string>;
  onFavorite: (id: string) => void;
  onCopy: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onNewPrompt: () => void;
}

export function LibraryPage({
  prompts,
  sections,
  loading,
  activeSectionId,
  onSectionChange,
  peopleFilter,
  onPeopleChange,
  sortOption,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
  searchQuery,
  onSearchChange,
  copiedToday,
  favorites,
  onFavorite,
  onCopy,
  onOpenDetail,
}: LibraryPageProps) {

  const filtered = useMemo(() => {
    let list = [...prompts];

    if (activeSectionId !== 'all') {
      list = list.filter(p => p.sectionId === activeSectionId);
    }
    if (peopleFilter !== 'all') {
      list = list.filter(p => String(p.peopleCount) === peopleFilter);
    }
    if (showFavoritesOnly) {
      list = list.filter(p => favorites.has(p.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    switch (sortOption) {
      case 'copies': list.sort((a, b) => (b.copies ?? 0) - (a.copies ?? 0)); break;
      case 'az': list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')); break;
      case 'recent': default: list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)); break;
    }

    return list;
  }, [prompts, activeSectionId, peopleFilter, showFavoritesOnly, searchQuery, sortOption, favorites]);

  const activeSection = sections.find(s => s.id === activeSectionId);
  const sectionTitle = activeSectionId === 'all' ? 'Todos os Prompts' : (activeSection?.name ?? '');
  const sectionSub = activeSectionId === 'all'
    ? 'Sua biblioteca completa'
    : `${filtered.length} prompt${filtered.length !== 1 ? 's' : ''} nesta seção`;

  return (
    <div className={styles.page}>
      <MobileSearch value={searchQuery} onChange={onSearchChange} />

      <StatsBar
        totalPrompts={prompts.length}
        totalSections={sections.length}
        copiedToday={copiedToday}
      />

      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>{sectionTitle}</div>
          <div className={styles.sectionSub}>{sectionSub}</div>
        </div>
      </div>

      <Filters
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={onSectionChange}
        peopleFilter={peopleFilter}
        onPeopleChange={onPeopleChange}
        sortOption={sortOption}
        onSortChange={onSortChange}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={onFavoritesToggle}
      />

      {loading ? (
        <SkeletonGrid count={8} />
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyText}>Nenhum prompt encontrado</div>
          <div className={styles.emptySub}>Tente outros filtros ou adicione novos prompts</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((prompt, i) => {
            const section = sections.find(s => s.id === prompt.sectionId);
            return (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                section={section}
                isFavorite={favorites.has(prompt.id)}
                onFavorite={() => onFavorite(prompt.id)}
                onCopy={() => onCopy(prompt.id)}
                onClick={() => onOpenDetail(prompt.id)}
                animationDelay={i * 40}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
