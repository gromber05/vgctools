import { writeConsent } from '@/state/consent';
import { href } from './router';

export function AppFooter() {
  return (
    <footer className="appfooter">
      <nav aria-label="Información legal">
        <a href={href({ page: 'privacy' })}>Privacidad</a>
        <a href={href({ page: 'terms' })}>Términos y aviso legal</a>
        <button className="link-btn" onClick={() => writeConsent(null)}>
          Preferencias de cookies
        </button>
      </nav>
      <p>
        Proyecto no oficial, sin afiliación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. Pokémon es una marca de sus
        respectivos titulares.
      </p>
    </footer>
  );
}
