import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import styles from './AdminPage.module.css';
import type { Prompt, Section } from '../../lib/types';

interface AdminPageProps {
  prompts: Prompt[];
  sections: Section[];
  onReorderPrompts: (prompts: Prompt[]) => Promise<void>;
  onReorderSections: (sections: Section[]) => Promise<void>;
  onEditPrompt: (id: string) => void;
  onDeletePrompt: (id: string) => Promise<void>;
  onEditSection: (id: string) => void;
  onDeleteSection: (id: string) => Promise<void>;
  onNewSection: () => void;
}

export function AdminPage({
  prompts, sections,
  onReorderPrompts, onReorderSections,
  onEditPrompt, onDeletePrompt,
  onEditSection, onDeleteSection,
  onNewSection,
}: AdminPageProps) {

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    if (source.droppableId === 'sections') {
      const reordered = [...sections];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      await onReorderSections(reordered);
    } else if (source.droppableId === 'prompts') {
      const reordered = [...prompts];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      await onReorderPrompts(reordered);
    }
  }

  async function handleDeletePrompt(id: string) {
    if (!confirm('Excluir este prompt?')) return;
    await onDeletePrompt(id);
  }

  async function handleDeleteSection(id: string) {
    const count = prompts.filter(p => p.sectionId === id).length;
    if (count > 0 && !confirm(`Esta seção tem ${count} prompt(s). Excluir mesmo assim?`)) return;
    await onDeleteSection(id);
  }

  return (
    <div className={styles.page}>
      <DragDropContext onDragEnd={handleDragEnd}>

        {/* Seções */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>✦ Seções</div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Nome</th>
                  <th>Prompts</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <Droppable droppableId="sections">
                {provided => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {sections.map((s, i) => (
                      <Draggable key={s.id} draggableId={s.id} index={i}>
                        {prov => (
                          <tr ref={prov.innerRef} {...prov.draggableProps}>
                            <td><span className={styles.dragHandle} {...prov.dragHandleProps}>⠿</span></td>
                            <td>{s.icon} {s.name}</td>
                            <td>{prompts.filter(p => p.sectionId === s.id).length}</td>
                            <td>
                              <div className={styles.actions}>
                                <button className={styles.editBtn} onClick={() => onEditSection(s.id)}>✎ Editar</button>
                                <button className={styles.deleteBtn} onClick={() => handleDeleteSection(s.id)}>✕</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </div>
          <button className={styles.addBtn} onClick={onNewSection}>+ Nova Seção</button>
        </div>

        {/* Prompts */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>◈ Todos os Prompts</div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th style={{ width: 56 }}>Foto</th>
                  <th>Título</th>
                  <th>Seção</th>
                  <th>Modelo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <Droppable droppableId="prompts">
                {provided => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {prompts.map((p, i) => {
                      const sec = sections.find(s => s.id === p.sectionId);
                      return (
                        <Draggable key={p.id} draggableId={p.id} index={i}>
                          {prov => (
                            <tr ref={prov.innerRef} {...prov.draggableProps}>
                              <td><span className={styles.dragHandle} {...prov.dragHandleProps}>⠿</span></td>
                              <td>
                                {p.image
                                  ? <img src={p.image} className={styles.thumb} alt={p.title} />
                                  : <div className={styles.thumbPlaceholder}>📷</div>
                                }
                              </td>
                              <td className={styles.titleCell}>{p.title}</td>
                              <td>{sec ? `${sec.icon} ${sec.name}` : '—'}</td>
                              <td><span className={styles.badge}>{p.model}</span></td>
                              <td>
                                <div className={styles.actions}>
                                  <button className={styles.editBtn} onClick={() => onEditPrompt(p.id)}>✎ Editar</button>
                                  <button className={styles.deleteBtn} onClick={() => handleDeletePrompt(p.id)}>✕</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </div>
        </div>

      </DragDropContext>
    </div>
  );
}
