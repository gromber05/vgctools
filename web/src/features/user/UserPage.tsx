import { useState, type FormEvent } from 'react';
import { href } from '@/app/router';
import { Card, StatTile } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import { usageByMon } from '@/lib/stats/aggregates';
import { pct, toID } from '@/lib/utils';
import { gamesOf } from '@/state/team';
import type { Account } from '@/state/useAccount';

export function UserPage({ account }: { account: Account }) {
  const { user, state } = account;
  if (!user) return null;

  const games = state.teams.flatMap(gamesOf);
  const wins = games.filter((g) => g.result === 'W').length;
  const topMons = usageByMon(games, [])
    .filter((m) => m.brought.games > 0)
    .sort((a, b) => b.brought.games - a.brought.games)
    .slice(0, 6);

  return (
    <div className="page user-page">
      <div className="page-head">
        <div>
          <h1>{user.username}</h1>
          <p className="lede">
            Cuenta creada el {new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </div>

      <div className="tiles">
        <StatTile label="Equipos" value={state.teams.length} />
        <StatTile label="Partidas" value={games.length} />
        <StatTile label="Récord" value={`${wins}–${games.length - wins}`} />
        <StatTile label="Win% total" value={pct(wins, games.length)} />
      </div>

      <div className="two">
        <ShowdownNamesCard
          names={state.names}
          onSave={(names) =>
            account.update((d) => {
              d.names = names;
            })
          }
        />
        <Card title="Tus Pokémon más usados">
          {topMons.length ? (
            <ul className="top-mons">
              {topMons.map((m) => (
                <li key={m.species}>
                  <Sprite name={m.species} size={56} big />
                  <b>{m.species}</b>
                  <span className="muted small">
                    {m.brought.games} partidas · {pct(m.brought.wins, m.brought.games)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Aparecerán cuando tengas partidas registradas.</p>
          )}
        </Card>
      </div>

      <div className="two">
        <PasswordCard onChange={account.changePassword} />
        <DataCard onExport={account.exportData} />
      </div>

      <DeleteAccountCard onDelete={account.deleteAccount} />
    </div>
  );
}

const MAX_SHOWDOWN_NAMES = 10;

function ShowdownNamesCard({ names, onSave }: { names: string[]; onSave: (names: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const full = names.length >= MAX_SHOWDOWN_NAMES;

  const add = (e: FormEvent) => {
    e.preventDefault();
    // Allow pasting several names at once, separated by commas.
    const incoming = draft
      .split(',')
      .map((n) => n.trim().slice(0, 40))
      .filter(Boolean);
    const next = [...names];
    for (const name of incoming) {
      if (!next.some((n) => toID(n) === toID(name))) next.push(name);
    }
    if (next.length > MAX_SHOWDOWN_NAMES) {
      setError(`Puedes guardar como máximo ${MAX_SHOWDOWN_NAMES} nombres.`);
      return;
    }
    if (next.length === names.length) {
      setError(incoming.length ? 'Ese nombre ya está guardado.' : '');
      return;
    }
    onSave(next);
    setDraft('');
    setError('');
  };

  return (
    <Card title="Nombres de Showdown">
      <form className="stack-form" onSubmit={add}>
        <p className="muted small">Sirven para saber qué jugador eres en cada repetición. Añade todas tus cuentas.</p>
        {names.length > 0 ? (
          <ul className="showdown-names">
            {names.map((n) => (
              <li key={n} className="chip">
                {n}
                <button type="button" className="ghost" aria-label={`Quitar ${n}`} onClick={() => onSave(names.filter((x) => x !== n))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Aún no has añadido ningún nombre.</p>
        )}
        <div className="actions">
          <input
            id="profile-showdown-names"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
            }}
            placeholder={full ? 'Has llegado al máximo' : 'p. ej. room3roo'}
            maxLength={200}
            disabled={full}
          />
          <button className="primary" type="submit" disabled={full || !draft.trim()}>
            Añadir
          </button>
        </div>
        {error && <p className="error small">{error}</p>}
      </form>
    </Card>
  );
}

function DataCard({ onExport }: { onExport: () => Promise<void> }) {
  const [error, setError] = useState('');
  return (
    <Card title="Tus datos">
      <p className="muted small">
        Descarga en un archivo JSON todo lo que VGC Tools guarda sobre ti: cuenta, nombres de Showdown, equipos, partidas y notas. Más
        detalles en la <a href={href({ page: 'privacy' })}>política de privacidad</a>.
      </p>
      {error && <p className="error small">{error}</p>}
      <div className="actions">
        <button onClick={() => onExport().catch((e: Error) => setError(e.message))}>Descargar mis datos</button>
      </div>
    </Card>
  );
}

function PasswordCard({ onChange }: { onChange: (current: string, next: string) => Promise<void> }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await onChange(current, next);
      setCurrent('');
      setNext('');
      setMsg({ ok: true, text: 'Contraseña cambiada.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
    setBusy(false);
  };

  return (
    <Card title="Cambiar contraseña">
      <form className="stack-form" onSubmit={(e) => void submit(e)}>
        <label className="field">
          <span>Contraseña actual</span>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Contraseña nueva</span>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <span className="muted small">Mínimo 8 caracteres.</span>
        </label>
        <p className="muted small">Al cambiarla se cerrará la sesión en tus otros dispositivos.</p>
        {msg && <p className={msg.ok ? 'small ok' : 'error small'}>{msg.text}</p>}
        <div className="actions">
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </Card>
  );
}

function DeleteAccountCard({ onDelete }: { onDelete: (password: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onDelete(password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Card title="Borrar la cuenta" className="danger-card">
      <p className="muted small">Se borran tu cuenta y todos tus equipos y partidas. No se puede deshacer.</p>
      {open ? (
        <form className="stack-form" onSubmit={(e) => void submit(e)}>
          <label className="field">
            <span>Escribe tu contraseña para confirmar</span>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error small">{error}</p>}
          <div className="actions">
            <button className="danger" type="submit" disabled={busy}>
              {busy ? 'Borrando…' : 'Borrar mi cuenta para siempre'}
            </button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button className="danger" onClick={() => setOpen(true)}>
          Borrar mi cuenta
        </button>
      )}
    </Card>
  );
}
