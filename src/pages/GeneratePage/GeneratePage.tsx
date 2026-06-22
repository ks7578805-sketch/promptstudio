import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './GeneratePage.module.css';
import { Slider } from '../../components/Slider/Slider';
import type { Prompt, GeminiModel, OpenAIModel, AnyImageModel, Resolution, Provider } from '../../lib/types';
import { PROVIDER_INFO } from '../../lib/types';

const MAX_REFERENCE_IMAGES = 14;

interface GeneratePageProps {
  prompt: Prompt | null;
  onBack: () => void;
  onGenerate: (params: {
    referenceImages: string[];
    provider: Provider;
    model: AnyImageModel;
    resolution: Resolution;
    count: number;
    customPrompt: string;
    identityBoost: boolean;
  }) => void;
}

function compressImage(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = ev.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ModelOption {
  id: AnyImageModel;
  name: string;
  speed: string;
  badge?: string;
}

const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', speed: '⚡ Mais rápido' },
  { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2', speed: '⚡ Rápido + qualidade' },
  { id: 'gemini-3-pro-image', name: 'Nano Banana Pro', speed: '★ Qualidade máxima' },
];

const OPENAI_MODELS: ModelOption[] = [
  { id: 'gpt-image-1-mini', name: 'GPT Image Mini', speed: '⚡ Econômico' },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', speed: '⚡ Rápido + qualidade' },
  { id: 'gpt-image-2', name: 'GPT Image 2', speed: '★★ Top (mais lento)', badge: 'NOVO' },
];

export function GeneratePage({ prompt, onBack, onGenerate }: GeneratePageProps) {
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [provider, setProvider] = useState<Provider>('google');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-3.1-flash-image');
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('gpt-image-1.5');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [count, setCount] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(!prompt);
  const [customPrompt, setCustomPrompt] = useState(prompt?.prompt ?? '');
  const [identityBoost, setIdentityBoost] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCustomPrompt(prompt?.prompt ?? '');
    setEditingPrompt(!prompt);
  }, [prompt?.id, prompt?.prompt, prompt]);

  useEffect(() => {
    if (editingPrompt && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingPrompt]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (list.length === 0) return;

    const available = MAX_REFERENCE_IMAGES - referenceImages.length;
    const toProcess = list.slice(0, available);

    const compressed = await Promise.all(toProcess.map(f => compressImage(f)));
    setReferenceImages(prev => [...prev, ...compressed]);
  }, [referenceImages.length]);

  function removeImage(index: number) {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  }

  function handleGenerate() {
    if (!customPrompt.trim()) return;
    const selectedModel: AnyImageModel = provider === 'google' ? geminiModel : openaiModel;
    onGenerate({
      referenceImages,
      provider,
      model: selectedModel,
      resolution,
      count,
      customPrompt: customPrompt.trim(),
      identityBoost,
    });
  }

  function resetPrompt() {
    setCustomPrompt(prompt?.prompt ?? '');
    setEditingPrompt(!prompt);
  }

  const isEdited = !!prompt && customPrompt.trim() !== prompt.prompt.trim();
  const currentModels = provider === 'google' ? GEMINI_MODELS : OPENAI_MODELS;
  const currentModel: string = provider === 'google' ? geminiModel : openaiModel;
  const canAddMore = referenceImages.length < MAX_REFERENCE_IMAGES;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← Voltar</button>

      <div className={styles.title}>
        <span>✦</span> Gerar Imagem
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepTitle}>
            {prompt ? 'Estilo escolhido' : 'Escreva seu prompt'}
          </div>
        </div>
        {prompt ? (
          <div className={styles.styleCard}>
            {prompt.image ? (
              <img className={styles.styleThumb} src={prompt.image} alt={prompt.title} />
            ) : (
              <div className={styles.stylePlaceholder}>📷</div>
            )}
            <div className={styles.styleInfo}>
              <div className={styles.styleName}>
                {prompt.title}
                {isEdited && <span className={styles.editedBadge}>editado</span>}
              </div>
              {!editingPrompt ? (
                <div className={styles.promptPreview}>
                  <span className={styles.promptText}>{customPrompt}</span>
                  <button
                    className={styles.editPromptBtn}
                    onClick={() => setEditingPrompt(true)}
                    title="Editar prompt"
                    aria-label="Editar prompt"
                  >
                    ✎
                  </button>
                </div>
              ) : (
                <div className={styles.promptEdit}>
                  <textarea
                    ref={textareaRef}
                    className={styles.promptTextarea}
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    rows={6}
                    placeholder="Escreva o prompt..."
                  />
                  <div className={styles.promptEditActions}>
                    {isEdited && (
                      <button className={styles.resetBtn} onClick={resetPrompt}>
                        ↺ Restaurar original
                      </button>
                    )}
                    <button className={styles.doneBtn} onClick={() => setEditingPrompt(false)}>
                      ✓ Pronto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className={styles.promptTextarea}
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={6}
            placeholder="Descreva a imagem que você quer gerar. Ex: A professional portrait of a woman in a white studio with soft lighting..."
            autoFocus
          />
        )}
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepTitle}>Fotos de referência <span style={{fontWeight:400,fontSize:'0.85em',color:'var(--text3)'}}>(opcional)</span></div>
        </div>

        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) { handleFiles(e.target.files); e.target.value = ''; } }}
        />

        {referenceImages.length === 0 ? (
          <div
            className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
            }}
          >
            <div className={styles.uploadIcon}>📷</div>
            <div className={styles.uploadText}>Toque para enviar suas fotos</div>
            <div className={styles.uploadSub}>ou arraste e solte aqui · até {MAX_REFERENCE_IMAGES} fotos</div>
          </div>
        ) : (
          <>
            <div
              className={styles.imagesGrid}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
              }}
            >
              {referenceImages.map((img, i) => (
                <div key={i} className={styles.imageItem}>
                  <img src={img} alt={`Referência ${i + 1}`} />
                  <button
                    className={styles.imageRemoveBtn}
                    onClick={() => removeImage(i)}
                    title="Remover"
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              ))}
              {canAddMore && (
                <button
                  className={styles.addMoreCard}
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  <span className={styles.addMoreIcon}>+</span>
                  <span className={styles.addMoreText}>Adicionar foto</span>
                </button>
              )}
            </div>
            <div className={styles.imagesCount}>
              {referenceImages.length} de {MAX_REFERENCE_IMAGES} fotos
              {!canAddMore && ' · limite atingido'}
            </div>
          </>
        )}
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepTitle}>Reforço de identidade</div>
        </div>
        <label className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <div className={styles.toggleTitle}>
              🧬 Preservar rosto e identidade
            </div>
            <div className={styles.toggleDesc}>
              Adiciona instruções pra IA manter o rosto, traços e aparência da pessoa o mais fiel possível às fotos enviadas.
            </div>
          </div>
          <div className={styles.toggle}>
            <input
              type="checkbox"
              checked={identityBoost}
              onChange={e => setIdentityBoost(e.target.checked)}
            />
            <span className={styles.toggleSlider} />
          </div>
        </label>
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepTitle}>Escolha o provedor</div>
        </div>
        <div className={styles.providerRow}>
          {(['google', 'openai'] as Provider[]).map(p => {
            const info = PROVIDER_INFO[p];
            return (
              <button
                key={p}
                className={`${styles.providerCard} ${provider === p ? styles.active : ''}`}
                onClick={() => setProvider(p)}
              >
                <div className={styles.providerIcon}>{info.icon}</div>
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>{info.name}</div>
                  <div className={styles.providerDesc}>{info.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>5</div>
          <div className={styles.stepTitle}>Escolha o modelo</div>
        </div>
        <div className={styles.modelRow} style={{
          gridTemplateColumns: `repeat(${currentModels.length}, 1fr)`,
        }}>
          {currentModels.map(m => (
            <button
              key={m.id}
              className={`${styles.modelCard} ${currentModel === m.id ? styles.active : ''}`}
              onClick={() => provider === 'google' ? setGeminiModel(m.id as GeminiModel) : setOpenaiModel(m.id as OpenAIModel)}
            >
              <div className={styles.modelName}>
                {m.name}
                {m.badge && <span className={styles.modelBadge}>{m.badge}</span>}
              </div>
              <div className={styles.modelSpeed}>{m.speed}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>6</div>
          <div className={styles.stepTitle}>Resolução</div>
        </div>
        <div className={styles.resolutionRow}>
          <button
            className={`${styles.resolutionCard} ${resolution === '1K' ? styles.active : ''}`}
            onClick={() => setResolution('1K')}
          >
            <div className={styles.resolutionLabel}>1K</div>
          </button>
          <button
            className={`${styles.resolutionCard} ${resolution === '2K' ? styles.active : ''}`}
            onClick={() => setResolution('2K')}
          >
            <div className={styles.resolutionLabel}>2K</div>
          </button>
          <button
            className={`${styles.resolutionCard} ${resolution === '4K' ? styles.active : ''}`}
            onClick={() => setResolution('4K')}
          >
            <div className={styles.resolutionTag}>Alta Definição</div>
            <div className={styles.resolutionLabel}>4K</div>
          </button>
        </div>
        {provider === 'openai' && (
          <div style={{
            fontSize: 11,
            color: 'var(--text3)',
            marginTop: 8,
            fontStyle: 'italic',
          }}>
            ℹ OpenAI usa resoluções fixas (1024×1024 ou 1024×1536). 2K/4K são adaptadas pra qualidade máxima.
          </div>
        )}
      </div>

      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>7</div>
          <div className={styles.stepTitle}>Quantidade de imagens</div>
        </div>
        <Slider
          label="Imagens"
          value={count}
          min={1}
          max={10}
          onChange={setCount}
          unit={count === 1 ? 'imagem' : 'imagens'}
        />
      </div>

      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={!customPrompt.trim()}
      >
        ✦ Gerar {count > 1 ? `${count} imagens` : 'imagem'}
      </button>
    </div>
  );
}
