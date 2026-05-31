import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { LibraryPage } from './pages/LibraryPage/LibraryPage';
import { AdminPage } from './pages/AdminPage/AdminPage';
import { GeneratePage } from './pages/GeneratePage/GeneratePage';
import { HistoryPage } from './pages/HistoryPage/HistoryPage';
import { PromptModal } from './components/PromptModal/PromptModal';
import { DetailModal } from './components/DetailModal/DetailModal';
import { SectionModal } from './components/SectionModal/SectionModal';
import { Toast, useToast } from './components/Toast/Toast';
import { usePrompts } from './hooks/usePrompts';
import { useFavorites } from './hooks/useFavorites';
import { useGenerationQueue } from './hooks/useGenerationQueue';
import { useTheme } from './hooks/useTheme';
import type { SortOption, PeopleFilter, Prompt, Section, AnyImageModel, Resolution, Provider } from './lib/types';

type View = 'library' | 'admin' | 'generate' | 'history';

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
  const { theme, toggleTheme } = useTheme();

  // View atual
  const [view, setView] = useState<View>('library');
  const [generatingFor, setGeneratingFor] = useState<Prompt | null>(null);

  // Navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('all');

  // Filters
  const [search, setSearch] = useState('');
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Stats
  const [copiedToday, setCopiedToday] = useState(0);

  // Modals
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPromptId, setDetailPromptId] = useState<string | null>(null);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Fechar sidebar no resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Notifica quando uma geração termina
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

  function openGenerate() {
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

  function handleGenerate(params: {
    referenceImages: string[];
    provider: Provider;
    model: AnyImageModel;
    resolution: Resolution;
    count: number;
    customPrompt: string;
    identityBoost: boolean;
  }) {
    if (!generatingFor) return;
    queue.addJob({
      promptId: generatingFor.id,
      promptTitle: generatingFor.title,
      promptText: params.customPrompt,
      referenceImages: params.referenceImages,
      provider: params.provider,
      model: params.model,
      resolution: params.resolution,
      count: params.count,
      identityBoost: params.identityBoost,
    });
    showToast(`✦ Gerando ${params.count} ${params.count === 1 ? 'imagem' : 'imagens'}...`, 'success');
    setGeneratingFor(null);
    setView('library');
  }

  function getHeaderTitle() {
    if (view === 'admin') return { title: 'Painel', highlight: 'Admin' };
    if (view === 'generate') return { title: 'Gerar', highlight: 'Imagem' };
    if (view === 'history') return { title: 'Histórico', highlight: '' };
    if (activeSectionId === 'all') return { title: 'Todos os', highlight: 'Prompts' };
    const section = sections.find(s => s.id === activeSectionId);
    return { title: section?.name ?? '', highlight: '' };
  }

  const { title, highlight } = getHeaderTitle();
  const detailPrompt = prompts.find(p => p.id === detailPromptId) ?? null;
  const detailSection = sections.find(s => s.id === detailPrompt?.sectionId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        sections={sections}
        prompts={prompts}
        activeSectionId={activeSectionId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectSection={id => { setActiveSectionId(id); setView('library'); setSearch(''); }}
        onNewPrompt={openNewPrompt}
        onAdmin={() => setView('admin')}
        isAdminActive={view === 'admin'}
      />

      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1 }} className="main-content">
        <Header
          title={title}
          titleHighlight={highlight}
          searchValue={search}
          onSearchChange={setSearch}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          onNewPrompt={openNewPrompt}
          onHistory={() => setView('history')}
          historyActiveCount={queue.activeCount}
          historyTotalCount={queue.jobs.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {view === 'library' && (
          <LibraryPage
            prompts={prompts}
            sections={sections}
            loading={loading}
            activeSectionId={activeSectionId}
            onSectionChange={id => { setActiveSectionId(id); setView('library'); }}
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

        {view === 'generate' && generatingFor && (
          <GeneratePage
            prompt={generatingFor}
            onBack={() => { setGeneratingFor(null); setView('library'); }}
            onGenerate={handleGenerate}
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
      </div>

      {/* Modais */}
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
        onGenerate={openGenerate}
      />

      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        onSave={handleSaveSection}
        onDelete={handleDeleteSection}
        editingSection={editingSection}
      />

      <Toast {...toast} />
    </div>
  );
}
