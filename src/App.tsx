import { useState, useEffect } from 'react';
import { BottomNav, type NavView } from './components/BottomNav/BottomNav';
import { Header } from './components/Header/Header';
import { LibraryPage } from './pages/LibraryPage/LibraryPage';
import { AdminPage } from './pages/AdminPage/AdminPage';
import { GeneratePage } from './pages/GeneratePage/GeneratePage';
import { HistoryPage } from './pages/HistoryPage/HistoryPage';
import { ProfilePage } from './pages/ProfilePage/ProfilePage';
import { PromptModal } from './components/PromptModal/PromptModal';
import { DetailModal } from './components/DetailModal/DetailModal';
import { SectionModal } from './components/SectionModal/SectionModal';
import { Toast, useToast } from './components/Toast/Toast';
import { usePrompts } from './hooks/usePrompts';
import { useFavorites } from './hooks/useFavorites';
import { useGenerationQueue } from './hooks/useGenerationQueue';
import { useTheme } from './hooks/useTheme';
import type { SortOption, PeopleFilter, Prompt, Section } from './lib/types';

export default function App() {
  const {
    sections, prompts, loading,
    savePrompt, deletePrompt,
    saveSection, deleteSection,
    reorderPrompts, reorderSections,
    incrementCopies,
  } = usePrompts();

  const { favorites, toggleFavorite } = useFavorites();
  const { toast, showToast } = useToast();
  const queue = useGenerationQueue();
  const { theme, setTheme } = useTheme();

  const [view, setView] = useState<NavView>('library');
  const [generatingFor, setGeneratingFor] = useState<Prompt | null>(null);

  const [activeSectionId, setActiveSectionId] = useState('all');
  const [search, setSearch] = useState('');
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [copiedToday, setCopiedToday] = useState(0);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPromptId, setDetailPromptId] = useState<string | null>(null);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    const justFinished = queue.jobs.find(
      j => (j.status === 'done' || j.status === 'error') && j.completedAt && Date.now() - j.completedAt < 1000
    );
    if (justFinished) {
      if (justFinished.status === 'done') {
        showToast(`✓ "${justFinished.promptTitle}" pronto!`, 'success');
      } else {
        showToast(`✕ Erro: ${justFinished.error}`, 'error');
      }
    }
  }, [queue.jobs, showToast]);

  function handleNavChange(v: NavView) {
    if (v === 'generate') {
      setGeneratingFor(null);
    }
    setView(v);
  }

  function openNewPrompt() {
    setEditingPrompt(null);
    setPromptModalOpen(true);
  }

  function openEditPrompt(id: string) {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    setEditingPrompt(p);
    setPromptModalOpen(true);
    setDetailModalOpen(false);
  }

  function openDetail(id: string) {
    setDetailPromptId(id);
    setDetailModalOpen(true);
  }

  function openGenerateFromPrompt() {
    const p = prompts.find(x => x.id === detailPromptId);
    if (!p) return;
    setGeneratingFor(p);
    setDetailModalOpen(false);
    setView('generate');
  }

  async function handleSavePrompt(prompt: Prompt) {
    await savePrompt(prompt);
    showToast('Prompt salvo!', 'success');
  }

  async function handleDeletePrompt(id: string) {
    await deletePrompt(id);
    showToast('Prompt excluído', 'error');
  }

  async function handleCopy(id: string) {
    setCopiedToday(prev => prev + 1);
    await incrementCopies(id);
    showToast('Prompt copiado!', 'success');
  }

  function openNewSection() {
    setEditingSection(null);
    setSectionModalOpen(true);
  }

  function openEditSection(id: string) {
    const s = sections.find(x => x.id === id);
    if (!s) return;
    setEditingSection(s);
    setSectionModalOpen(true);
  }

  async function handleSaveSection(section: Section) {
    await saveSection(section);
    showToast('Seção salva!', 'success');
  }

  async function handleDeleteSection(id: string) {
    await deleteSection(id);
    showToast('Seção excluída', 'error');
  }

  function getHeaderTitle() {
    if (view === 'admin') return { title: 'Painel', highlight: 'Admin' };
    if (view === 'generate') return { title: 'Gerar', highlight: 'Imagem' };
    if (view === 'history') return { title: '', highlight: 'Histórico' };
    if (view === 'profile') return { title: '', highlight: 'Perfil' };
    if (activeSectionId === 'all') return { title: 'Todos os', highlight: 'Prompts' };
    const section = sections.find(s => s.id === activeSectionId);
    return { title: section?.name ?? '', highlight: '' };
  }

  const { title, highlight } = getHeaderTitle();
  const detailPrompt = prompts.find(p => p.id === detailPromptId) ?? null;
  const detailSection = sections.find(s => s.id === detailPrompt?.sectionId);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))' }}>
      <Header
        title={title}
        titleHighlight={highlight}
        searchValue={search}
        onSearchChange={setSearch}
        onMenuToggle={() => {}}
        onNewPrompt={openNewPrompt}
      />

      {view === 'library' && (
        <LibraryPage
          prompts={prompts}
          sections={sections}
          loading={loading}
          activeSectionId={activeSectionId}
          onSectionChange={setActiveSectionId}
          peopleFilter={peopleFilter}
          onPeopleChange={setPeopleFilter}
          sortOption={sortOption}
          onSortChange={setSortOption}
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={() => setShowFavoritesOnly(prev => !prev)}
          searchQuery={search}
          onSearchChange={setSearch}
          copiedToday={copiedToday}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onCopy={openDetail}
          onOpenDetail={openDetail}
          onNewPrompt={openNewPrompt}
        />
      )}

      {view === 'admin' && (
        <AdminPage
          prompts={prompts}
          sections={sections}
          onReorderPrompts={reorderPrompts}
          onReorderSections={reorderSections}
          onEditPrompt={openEditPrompt}
          onDeletePrompt={handleDeletePrompt}
          onEditSection={openEditSection}
          onDeleteSection={handleDeleteSection}
          onNewSection={openNewSection}
        />
      )}

      {view === 'generate' && (
        <GeneratePage
          prompt={generatingFor}
          onBack={() => { setGeneratingFor(null); setView('library'); }}
          onGenerate={({ referenceImages, provider, model, resolution, count, customPrompt, identityBoost }) => {
            queue.addJob({
              promptId: generatingFor?.id ?? 'free',
              promptTitle: generatingFor?.title ?? 'Geração livre',
              promptText: customPrompt,
              referenceImages,
              provider,
              model,
              resolution,
              count,
              identityBoost,
            });
            showToast(`✦ Gerando ${count} ${count === 1 ? 'imagem' : 'imagens'}...`, 'success');
            setGeneratingFor(null);
            setView('history');
          }}
        />
      )}

      {view === 'history' && (
        <HistoryPage
          jobs={queue.jobs}
          onRemoveJob={queue.removeJob}
          onClearDone={queue.clearDone}
          onClearAll={queue.clearAll}
        />
      )}

      {view === 'profile' && (
        <ProfilePage
          totalPrompts={prompts.length}
          totalGenerated={queue.jobs.length}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      <PromptModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
        sections={sections}
        editingPrompt={editingPrompt}
      />

      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        prompt={detailPrompt}
        section={detailSection}
        isFavorite={detailPromptId ? favorites.has(detailPromptId) : false}
        onFavorite={() => detailPromptId && toggleFavorite(detailPromptId)}
        onEdit={() => openEditPrompt(detailPromptId!)}
        onCopy={() => handleCopy(detailPromptId!)}
        onGenerate={openGenerateFromPrompt}
      />

      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        onSave={handleSaveSection}
        onDelete={handleDeleteSection}
        editingSection={editingSection}
      />

      <BottomNav
        active={view}
        onChange={handleNavChange}
        historyBadge={queue.jobs.length}
        hasActiveGeneration={queue.activeCount > 0}
      />

      <Toast {...toast} />
    </div>
  );
}
