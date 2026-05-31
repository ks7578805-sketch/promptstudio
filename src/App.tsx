import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { LibraryPage } from './pages/LibraryPage/LibraryPage';
import { AdminPage } from './pages/AdminPage/AdminPage';
import { PromptModal } from './components/PromptModal/PromptModal';
import { DetailModal } from './components/DetailModal/DetailModal';
import { SectionModal } from './components/SectionModal/SectionModal';
import { Toast, useToast } from './components/Toast/Toast';
import { usePrompts } from './hooks/usePrompts';
import { useFavorites } from './hooks/useFavorites';
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

  // Navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('all');
  const [isAdminActive, setIsAdminActive] = useState(false);

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

  // Paste de imagem global (quando modal de prompt está aberto)
  useEffect(() => {
    if (!promptModalOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/'));
      if (item) e.preventDefault(); // PromptModal vai lidar internamente
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [promptModalOpen]);

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
    if (isAdminActive) return { title: 'Painel', highlight: 'Admin' };
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
        onSelectSection={id => { setActiveSectionId(id); setIsAdminActive(false); setSearch(''); }}
        onNewPrompt={openNewPrompt}
        onAdmin={() => setIsAdminActive(true)}
        isAdminActive={isAdminActive}
      />

      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1 }} className="main-content">
        <Header
          title={title}
          titleHighlight={highlight}
          searchValue={search}
          onSearchChange={setSearch}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          onNewPrompt={openNewPrompt}
        />

        {!isAdminActive && (
          <LibraryPage
            prompts={prompts}
            sections={sections}
            loading={loading}
            activeSectionId={activeSectionId}
            onSectionChange={id => { setActiveSectionId(id); setIsAdminActive(false); }}
            peopleFilter={peopleFilter}
            onPeopleChange={setPeopleFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
            showFavoritesOnly={showFavoritesOnly}
            onFavoritesToggle={() => setShowFavoritesOnly(prev => !prev)}
            searchQuery={search}
            copiedToday={copiedToday}
            favorites={favorites}
            onFavorite={toggleFavorite}
            onCopy={handleCopy}
            onEdit={openEditPrompt}
            onOpenDetail={openDetail}
            onNewPrompt={openNewPrompt}
          />
        )}

        {isAdminActive && (
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
        onEdit={() => openEditPrompt(detailPromptId!)}
        onCopy={() => handleCopy(detailPromptId!)}
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
