import { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { formStyles } from '../Form/Form';
import type { Prompt, Section } from '../../lib/types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  section?: Section;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onGenerate: () => void;
}

export function DetailModal({
  isOpen, onClose, prompt, section,
  isFavorite, onFavorite,
  onEdit, onCopy, onGenerate,
}: DetailModalProps) {
  const [copied, setCopied] = useState(false);

  // Reset estado quando abrir modal novo
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen, prompt?.id]);

  if (!prompt) return null;

  function handleCopy() {
    navigator.clipboard.writeText(prompt!.prompt).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const footer = (
    <>
      <button className={formStyles.btnSecondary} onClick={onEdit}>✎ Editar</button>
      <button className={formStyles.btnSecondary} onClick={handleCopy}>
        {copied ? '✓ Copiado!' : '⎘ Copiar Prompt'}
      </button>
      <button className={formStyles.btnPrimary} onClick={onGenerate}>
        ✦ Gerar Imagem
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={prompt.title} footer={footer}>
      {prompt.image && (
        <div style={{ position: 'relative' }}>
          <img
            src={prompt.image}
            alt={prompt.title}
            style={{
              width: '100%',
              maxHeight: '380px',
              objectFit: 'cover',
              borderRadius: '14px',
              border: '1px solid var(--border)',
            }}
          />
          {onFavorite && (
            <button
              onClick={onFavorite}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isFavorite ? 'var(--red)' : 'rgba(255,255,255,0.92)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 17,
                color: isFavorite ? 'white' : 'var(--text)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(6px)',
              }}
              title={isFavorite ? 'Remover favorito' : 'Favoritar'}
            >
              {isFavorite ? '❤' : '♡'}
            </button>
          )}
        </div>
      )}

      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--red)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>#</span> PROMPT
        </div>
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 14,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text2)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          {prompt.prompt}
        </div>
      </div>

      {prompt.negative && (
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text3)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}>
            Negative Prompt
          </div>
          <div style={{
            background: 'var(--red-light)',
            border: '1px solid var(--red-mid)',
            borderRadius: 14,
            padding: 14,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--red)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {prompt.negative}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          ⎘ {prompt.copies ?? 0} cópias
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {section && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--red-light)', color: 'var(--red)', border: '1px solid var(--red-mid)' }}>
            {section.icon} {section.name}
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
          {prompt.ratio}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
          {prompt.model}
        </span>
        {(prompt.tags ?? []).map(t => (
          <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            {t}
          </span>
        ))}
      </div>
    </Modal>
  );
}
