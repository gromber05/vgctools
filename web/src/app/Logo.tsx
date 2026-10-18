// Mismo dibujo que public/logo.svg (favicon), pero con los tokens del tema
// para que siga a data-theme y no solo a la preferencia del sistema.
// Dos compañeros (rellenos) contra dos rivales (anillos): un combate doble.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)" />
      <g fill="var(--accent-ink)" stroke="var(--accent-ink)">
        <circle cx="8.5" cy="11" r="3.2" stroke="none" />
        <circle cx="8.5" cy="21" r="3.2" stroke="none" />
        <path d="M19.5 5 13 27" fill="none" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="23.5" cy="11" r="2.4" fill="none" strokeWidth="1.8" />
        <circle cx="23.5" cy="21" r="2.4" fill="none" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
