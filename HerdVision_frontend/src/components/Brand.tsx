// Logotipo e motivo "órbitas" (DESIGN.md §2). O símbolo aqui é uma aproximação vetorial;
// substitua pelo arquivo oficial exportado do Figma quando disponível.

interface SymbolProps {
  size?: number;
  variant?: 'primary' | 'reverse';
}

export function LogoSymbol({ size = 36, variant = 'primary' }: SymbolProps) {
  const square = variant === 'primary' ? 'var(--forest-900)' : 'var(--sand-50)';
  const figure = variant === 'primary' ? 'var(--white)' : 'var(--forest-900)';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill={square} />
      <path d="M14 18c2 9 8 13 14 13M50 18c-2 9-8 13-14 13" fill="none" stroke={figure} strokeWidth="4" strokeLinecap="round" />
      <path d="M22 30c0-3 4-5 10-5s10 2 10 5l-3 14c-1 4-4 7-7 7s-6-3-7-7z" fill={figure} />
      <path d="M32 33a5 5 0 0 0-5 5c0 4 5 8 5 8s5-4 5-8a5 5 0 0 0-5-5z" fill="var(--ochre-500)" />
      <circle cx="32" cy="38" r="1.8" fill={square} />
    </svg>
  );
}

interface LogoProps {
  variant?: 'primary' | 'reverse';
  symbolSize?: number;
  wordSize?: number;
}

export function Logo({ variant = 'primary', symbolSize = 36, wordSize = 22 }: LogoProps) {
  const herdColor = variant === 'primary' ? 'var(--bark-900)' : 'var(--sand-50)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoSymbol size={symbolSize} variant={variant} />
      <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: wordSize, lineHeight: 1, letterSpacing: '-0.01em' }}>
        <span style={{ color: herdColor }}>Herd</span>
        <span style={{ color: 'var(--ochre-500)' }}>Vision</span>
      </span>
    </span>
  );
}

/** Três órbitas concêntricas com núcleo ocre. Somente em superfícies de marca. */
export function Orbits({ className }: { className?: string }) {
  const dots = [
    { r: 120, angle: 200, color: 'var(--forest-300)' },
    { r: 120, angle: 320, color: 'var(--clay-300)' },
    { r: 190, angle: 150, color: 'var(--clay-300)' },
    { r: 190, angle: 250, color: 'var(--forest-300)' },
    { r: 260, angle: 190, color: 'var(--forest-300)' },
    { r: 260, angle: 230, color: 'var(--clay-300)' },
  ];
  return (
    <svg className={className} viewBox="0 0 560 560" aria-hidden="true" focusable="false">
      {[120, 190, 260].map((r) => (
        <circle key={r} cx="280" cy="280" r={r} fill="none" stroke="var(--sand-200)" strokeOpacity="0.55" strokeWidth="1.2" />
      ))}
      <circle cx="280" cy="280" r="26" fill="var(--ochre-500)" />
      {dots.map((d, i) => {
        const rad = (d.angle * Math.PI) / 180;
        return <circle key={i} cx={280 + d.r * Math.cos(rad)} cy={280 + d.r * Math.sin(rad)} r="7" fill={d.color} />;
      })}
    </svg>
  );
}
