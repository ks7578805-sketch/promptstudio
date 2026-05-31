import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import { FormGroup, FormRow, formStyles } from '../Form/Form';
import type { Prompt, Section } from '../../lib/types';

const MODELS = ['Nano Banana 2', 'Nano Banana Pro', 'Flux', 'Imagen 4', 'Outro'];
const RATIOS = ['9:16', '1:1', '4:5', '16:9'];
const PEOPLE_OPTIONS = ['', '1', '2', '3', '4', '5', '6'];

const SECTION_TITLE_MAP: Record<string, string> = {
  'Aniversários': 'Ensaio Aniversário',
  'Formaturas': 'Ensaio Formatura',
  'Dia das Mães': 'Ensaio Dia das Mães',
  'Crianças': 'Ensaio Infantil',
  'Corporativo': 'Ensaio Corporativo',
  'Gestante': 'Ensaio Gestante',
  'Família': 'Ensaio Família',
  'Mãe e Bebê': 'Ensaio Mãe e Bebê',
  'Newborn': 'Ensaio Newborn',
};

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  sections: Section[];
  editingPrompt?: Prompt | null;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = ev.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PromptModal({ isOpen, onClose, onSave, onDelete, sections, editingPrompt }: PromptModalProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [model, setModel] = useState('Nano Banana 2');
  const [ratio, setRatio] = useState('9:16');
  const [peopleCount, setPeopleCount] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [tagsTouched, setTagsTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingPrompt;

  useEffect(() => {
    if (!isOpen) return;
    if (editingPrompt) {
      setTitle(editingPrompt.title);
      setPrompt(editingPrompt.prompt);
      setNegative(editingPrompt.negative ?? '');
      setSectionId(editingPrompt.sectionId);
      setModel(editingPrompt.model);
      setRatio(editingPrompt.ratio);
      setPeopleCount(editingPrompt.peopleCount ? String(editingPrompt.peopleCount) : '');
      setTags((editingPrompt.tags ?? []).join(', '));
      setImage(editingPrompt.image ?? '');
      setTitleTouched(true);
      setTagsTouched(true);
    } else {
      setTitle('');
      setPrompt('');
      setNegative('');
      setSectionId(sections[0]?.id ?? '');
      setModel('Nano Banana 2');
      setRatio('9:16');
      setPeopleCount('');
      setTags('');
      setImage('');
      setTitleTouched(false);
      setTagsTouched(false);
    }
  }, [isOpen, editingPrompt, sections]);

  // Auto title e tags
  useEffect(() => {
    if (!titleTouched && sectionId) {
      const section = sections.find(s => s.id === sectionId);
      if (section) setTitle(SECTION_TITLE_MAP[section.name] ?? '');
    }
    if (!tagsTouched && sectionId) {
      const section = sections.find(s => s.id === sectionId);
      const autoTags: string[] = [];
      if (section) autoTags.push(section.name);
      if (peopleCount) autoTags.push(peopleCount === '1' ? '1 pessoa' : `${peopleCount} pessoas`);
      setTags(autoTags.join(', '));
    }
  }, [sectionId, peopleCount, titleTouched, tagsTouched, sections]);

  const handleImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const compressed = await compressImage(file);
    setImage(compressed);
  }, []);

  async function handleSave(addAnother = false) {
    if (!title.trim() || !prompt.trim() || !sectionId) return;
    setSaving(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const obj: Prompt = {
        id: editingPrompt?.id ?? `p${Date.now()}`,
        title: title.trim(),
        prompt: prompt.trim(),
        negative: negative.trim(),
        sectionId,
        model,
        ratio,
        peopleCount: peopleCount ? Number(peopleCount) : undefined,
        tags: tagList,
        image,
        copies: editingPrompt?.copies ?? 0,
        updatedAt: Date.now(),
        createdAt: editingPrompt?.createdAt ?? Date.now(),
      };
      await onSave(obj);
      if (addAnother) {
        setTitle(''); setPrompt(''); setNegative(''); setTags(''); setImage('');
        setPeopleCount(''); setTitleTouched(false); setTagsTouched(false);
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingPrompt || !onDelete) return;
    if (!confirm('Excluir este prompt?')) return;
    await onDelete(editingPrompt.id);
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
      {!isEditing && (
        <button className={formStyles.btnSecondary} onClick={() => handleSave(true)} disabled={saving}>
          Salvar e adicionar outro
        </button>
      )}
      <button className={formStyles.btnPrimary} onClick={() => handleSave()} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Prompt' : 'Novo Prompt'} footer={footer}>
      <FormGroup label="Título">
        <input
          className={formStyles.input}
          value={title}
          onChange={e => { setTitle(e.target.value); setTitleTouched(true); }}
          placeholder="Ex: Ensaio Dourado 40 Anos"
        />
      </FormGroup>

      <FormRow>
        <FormGroup label="Seção">
          <select className={formStyles.select} value={sectionId} onChange={e => setSectionId(e.target.value)}>
            {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Modelo IA">
          <select className={formStyles.select} value={model} onChange={e => setModel(e.target.value)}>
            {MODELS.map(m => <option key={m}>{m}</option>)}
          </select>
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup label="Proporção">
          <select className={formStyles.select} value={ratio} onChange={e => setRatio(e.target.value)}>
            {RATIOS.map(r => <option key={r}>{r}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Quantidade de pessoas">
          <select className={formStyles.select} value={peopleCount} onChange={e => setPeopleCount(e.target.value)}>
            {PEOPLE_OPTIONS.map(v => (
              <option key={v} value={v}>
                {v === '' ? 'Não definido' : v === '1' ? '1 pessoa' : `${v} pessoas`}
              </option>
            ))}
          </select>
        </FormGroup>
      </FormRow>

      <FormGroup label="Tags (vírgula)">
        <input
          className={formStyles.input}
          value={tags}
          onChange={e => { setTags(e.target.value); setTagsTouched(true); }}
          placeholder="dourado, balões, 40 anos"
        />
      </FormGroup>

      <FormGroup label="Prompt Principal">
        <textarea
          className={formStyles.textarea}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Cole o prompt completo aqui..."
          style={{ minHeight: '140px' }}
        />
      </FormGroup>

      <FormGroup label="Negative Prompt (opcional)">
        <textarea
          className={formStyles.textarea}
          value={negative}
          onChange={e => setNegative(e.target.value)}
          placeholder="blurry, distorted faces..."
          style={{ minHeight: '80px' }}
        />
      </FormGroup>

      <FormGroup label="Foto de Referência">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
        />
        {image ? (
          <>
            <img src={image} className={formStyles.uploadPreview} alt="Preview" />
            <button className={formStyles.changeImgBtn} onClick={() => fileInputRef.current?.click()}>
              🔄 Trocar imagem
            </button>
          </>
        ) : (
          <div
            className={`${formStyles.uploadArea} ${dragOver ? formStyles.dragOver : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files[0]; if (f) handleImage(f);
            }}
          >
            <div className={formStyles.icon}>🖼</div>
            <p>Clique, arraste ou cole uma imagem</p>
            <small>JPG, PNG — comprimido automaticamente</small>
          </div>
        )}
      </FormGroup>
    </Modal>
  );
}
