interface LogoProps {
  compact?: boolean;
  size?: number;
}

export function Logo({ compact = false, size = 32 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Ícone SVG: câmera com spark */}
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Corpo da câmera */}
        <rect x="2" y="9" width="28" height="19" rx="4" fill="#E53935"/>
        {/* Visor superior */}
        <path d="M11 9V7C11 6.45 11.45 6 12 6h4l2 3H11z" fill="#E53935"/>
        {/* Lente - anel externo */}
        <circle cx="16" cy="18" r="6" fill="white" opacity="0.15"/>
        <circle cx="16" cy="18" r="5" fill="white" opacity="0.2"/>
        {/* Lente - centro */}
        <circle cx="16" cy="18" r="3.5" fill="white" opacity="0.9"/>
        <circle cx="16" cy="18" r="2" fill="#E53935"/>
        {/* Spark / estrela sobreposta no canto superior direito */}
        <g transform="translate(22, 6)">
          <path d="M4 0 L4.8 3.2 L8 4 L4.8 4.8 L4 8 L3.2 4.8 L0 4 L3.2 3.2 Z" fill="white"/>
        </g>
        {/* Flash */}
        <rect x="24" y="11" width="3" height="2" rx="1" fill="white" opacity="0.6"/>
      </svg>

      {/* Texto — esconde se compact */}
      {!compact && (
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '1px', lineHeight: 1 }}>
          <span style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.03em'
          }}>Prompt</span>
          <span style={{
            fontSize: '17px',
            fontWeight: 800,
            color: '#E53935',
            letterSpacing: '-0.03em'
          }}>Studio</span>
        </span>
      )}
    </div>
  );
}
