import { useState } from 'react';
import type { Account } from '@/state/useAccount';
import { href } from './router';

const SAVE_LABEL = { saved: 'Guardado', saving: 'Guardando…', error: 'No se pudo guardar' } as const;

export function AppHeader({ account, loadingCount }: { account: Account; loadingCount: number }) {
  const { status, user, state, update, saveStatus, signOut } = account;

  return (
    <header className="appbar">
      <a className="brand" href={href({ page: 'teams' })}>
        <span className="brand-mark" aria-hidden="true" />
        VGC Tools
      </a>
      {loadingCount > 0 && <span className="appbar-status">Leyendo {loadingCount} repeticiones…</span>}
      {status === 'ready' && user && (
        <>
          <span className={`save-state is-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
          <ShowdownNames
            key={user.id}
            names={state.names}
            onChange={(names) =>
              update((d) => {
                d.names = names;
              })
            }
          />
          <span className="user">
            {user.username}
            <button className="ghost small" onClick={signOut}>
              Salir
            </button>
          </span>
        </>
      )}
    </header>
  );
}

function ShowdownNames({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  // Solo este campo cambia los nombres, así que el borrador local no se desincroniza.
  const [draft, setDraft] = useState(names.join(', '));

  const commit = () => {
    const next = draft
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (next.join() !== names.join()) onChange(next);
  };

  return (
    <label className={names.length ? 'name-field' : 'name-field is-missing'}>
      <span>Tu nombre en Showdown</span>
      <input
        id="showdown-names"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="p. ej. room3roo"
        title="Si tienes varias cuentas, sepáralas con comas"
      />
    </label>
  );
}
