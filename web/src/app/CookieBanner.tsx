import { useConsent, writeConsent } from '@/state/consent';
import { href } from './router';

export function CookieBanner() {
  const consent = useConsent();
  if (consent) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        Guardamos en tu navegador la sesión (imprescindible para seguir conectado) y, si aceptas, lo que dejes en la calculadora para que lo
        encuentres igual la próxima vez. Sin publicidad ni analítica. <a href={href({ page: 'privacy' })}>Más información</a>
      </p>
      <div className="cookie-actions">
        <button onClick={() => writeConsent('rejected')}>Rechazar</button>
        <button className="primary" onClick={() => writeConsent('accepted')}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
