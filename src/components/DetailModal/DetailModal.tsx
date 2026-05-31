import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { formStyles } from '../Form/Form';
import type { Prompt, Section } from '../../lib/types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  section?: Section;
  onEdit: () => void;
  onCopy: () => void;
}

export function DetailModal({ isOpen, onClose, prompt, section, onEdit, onCopy }: DetailModalProps) {
  const [copied, setCopied] = useState(false);

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
      <button className={formStyles.btnSecondary} onClick={onClose}>Fechar</button>
      <button className={formStyles.btnSecondary} onClick={onEdit}>✎ Editar</button>
      <button className={formStyles.btnPrimary} onClick={handleCopy}>
        {copied ? '✓ Copiado!' : '⎘ Copiar Prompt'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={prompt.title} footer={footer}>
      {prompt.image && (
        <img
          src={prompt.image}
          alt={prompt.title}
          style={{
            width: '100%',
            maxHeight: '320px',
            objectFit: 'cover',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        />
      )}

      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Prompt Principal
        </div>
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '13px',
          lineHeight: 1.7,
          color: 'var(--text2)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {prompt.prompt}
        </div>
      </div>

      {prompt.negative && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Negative Prompt
          </div>
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '13px',
            lineHeight: 1.7,
            color: '#B91C1C',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {prompt.negative}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {section && (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: 'var(--red-light)', color: 'var(--red)', border: '1px solid var(--red-mid)' }}>
            {section.icon} {section.name}
          </span>
        )}
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
          {prompt.ratio}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
          {prompt.model}
        </span>
        {(prompt.tags ?? []).map(t => (
          <span key={t} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            {t}
          </span>
        ))}
      </div>
    </Modal>
  );
}
