import { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { FormGroup, FormRow, formStyles } from '../Form/Form';
import type { Section, ColorOption } from '../../lib/types';

const COLORS: { value: ColorOption; label: string }[] = [
  { value: 'red', label: '🔴 Vermelho' },
  { value: 'blue', label: '🔵 Azul' },
  { value: 'green', label: '🟢 Verde' },
  { value: 'pink', label: '🩷 Rosa' },
  { value: 'gray', label: '⚫ Cinza' },
];

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Section) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingSection?: Section | null;
}

export function SectionModal({ isOpen, onClose, onSave, onDelete, editingSection }: SectionModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState<ColorOption>('red');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingSection;

  useEffect(() => {
    if (!isOpen) return;
    if (editingSection) {
      setName(editingSection.name);
      setIcon(editingSection.icon);
      setColor(editingSection.color);
    } else {
      setName(''); setIcon(''); setColor('red');
    }
  }, [isOpen, editingSection]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: editingSection?.id ?? `s${Date.now()}`,
        name: name.trim(),
        icon: icon.trim() || '📁',
        color,
        order: editingSection?.order ?? Date.now(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingSection || !onDelete) return;
    if (!confirm(`Excluir a seção "${editingSection.name}"?`)) return;
    await onDelete(editingSection.id);
    onClose();
  }

  const footer = (
    <>
      {isEditing && onDelete && (
        <div style={{ marginRight: 'auto' }}>
          <button className={formStyles.btnDanger} onClick={handleDelete}>✕ Excluir</button>
        </div>
      )}
      <button className={formStyles.btnSecondary} onClick={onClose}>Cancelar</button>
      <button className={formStyles.btnPrimary} onClick={handleSave} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Seção' : 'Nova Seção'} size="small" footer={footer}>
      <FormGroup label="Nome">
        <input className={formStyles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aniversários" />
      </FormGroup>
      <FormRow>
        <FormGroup label="Ícone (emoji)">
          <input className={formStyles.input} value={icon} onChange={e => setIcon(e.target.value)} placeholder="🎂" maxLength={2} />
        </FormGroup>
        <FormGroup label="Cor">
          <select className={formStyles.select} value={color} onChange={e => setColor(e.target.value as ColorOption)}>
            {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FormGroup>
      </FormRow>
    </Modal>
  );
}
