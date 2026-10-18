import type { Account } from '@/state/useAccount';
import { Logo } from './Logo';
import { href, type Route } from './router';

const SAVE_LABEL = { saved: 'Guardado', saving: 'Guardando…', error: 'No se pudo guardar' } as const;

const NAV: [Route['page'], string, Route][] = [
  ['teams', 'Equipos', { page: 'teams' }],
  ['calc', 'Calculadora', { page: 'calc' }],
  ['user', 'Usuario', { page: 'user' }],
];

interface AppHeaderProps {
  account: Account;
  route: Route;
  loadingCount: number;
}

export function AppHeader({ account, route, loadingCount }: AppHeaderProps) {
  const { status, user, state, saveStatus, signOut } = account;
  const active = route.page === 'team' ? 'teams' : route.page;

  return (
    <header className="appbar">
      <a className="brand" href={href({ page: 'teams' })}>
        <Logo />
        VGC Tools
      </a>
      {status === 'ready' && user && (
        <>
          <nav className="mainnav" aria-label="Secciones">
            {NAV.map(([page, label, target]) => (
              <a key={page} href={href(target)} aria-current={active === page ? 'page' : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <span className="appbar-right">
            {loadingCount > 0 && <span className="appbar-status">Leyendo {loadingCount} repeticiones…</span>}
            {!state.names.length && (
              <a className="appbar-warn" href={href({ page: 'user' })}>
                Añade tu nombre de Showdown
              </a>
            )}
            <span className={`save-state is-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
            <span className="user">
              {user.username}
              <button className="ghost small" onClick={signOut}>
                Salir
              </button>
            </span>
          </span>
        </>
      )}
    </header>
  );
}
