import { useState } from 'react';
import { Block, Sprites } from '../components/ui';
import { fetchPaste } from '../lib/paste';
import type { Game } from '../lib/replay';
import { totals } from '../lib/stats';
import type { AppState, Updater } from '../lib/storage';
import { pct } from '../lib/util';

export function Home({ state, update, games, goTo }: { state: AppState; update: Updater; games: Game[]; goTo: (tab: string) => void }) {
  const [names, setNames] = useState(state.names.join(', '));
  const [paste, setPaste] = useState(state.pasteUrl);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const t = totals(games);

  const saveNames = () =>
    update((d) => {
      d.names = names.split(',').map((n) => n.trim()).filter(Boolean);
    });

  const loadPaste = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { team } = await fetchPaste(paste);
      update((d) => {
        d.pasteUrl = paste.trim();
        d.team = team;
      });
      setMsg(`Equipo cargado: ${team.length} Pokémon.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="sheet-grid home">
      <Block tone="gold" className="banner">
        <div className="banner-title">Laboratorio VGC · Seguimiento de repeticiones</div>
        <div className="banner-sub">Pokémon Showdown · VGC dobles · inspirado en PASRS</div>
      </Block>

      <table className="steps">
        <tbody>
          <tr>
            <th>Paso 1</th>
            <td>Tu nombre de Showdown (si tienes varias cuentas, sepáralas con comas)</td>
            <td className="input-cell">
              <input id="names" value={names} onChange={(e) => setNames(e.target.value)} onBlur={saveNames} onKeyDown={(e) => e.key === 'Enter' && saveNames()} placeholder="room3roo" />
            </td>
          </tr>
          <tr>
            <th>Paso 2</th>
            <td>El pokepaste de tu equipo</td>
            <td className="input-cell">
              <div className="row">
                <input id="paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="https://pokepast.es/…" />
                <button onClick={loadPaste} disabled={busy || !paste.trim()}>{busy ? 'Cargando…' : 'Cargar'}</button>
              </div>
              {msg && <div className="hint">{msg}</div>}
            </td>
          </tr>
          <tr>
            <th>Paso 3</th>
            <td>Añade tus enlaces de repeticiones y el resto se calcula solo</td>
            <td className="input-cell">
              <button className="primary" onClick={() => goTo('replays')}>Ir a Replays</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="home-row">
        <Block title="Tu equipo" tone="blue">
          {state.team.length ? <Sprites names={state.team.map((m) => m.species)} size={56} /> : <p className="muted">Carga tu pokepaste en el paso 2.</p>}
        </Block>
        <Block title="Resumen" tone="green">
          <table className="kv">
            <tbody>
              <tr><th>Partidas</th><td className="num">{t.all.games}</td></tr>
              <tr><th>Récord</th><td className="num">{t.all.wins}–{t.all.games - t.all.wins}</td></tr>
              <tr><th>Win%</th><td className="num strong">{pct(t.all.wins, t.all.games)}</td></tr>
            </tbody>
          </table>
        </Block>
      </div>

      <Block title="Consejos" tone="gray">
        <ul className="tips">
          <li>Usa siempre el mismo equipo y un pokepaste que coincida con él. Cuando cambies de equipo, empieza con datos nuevos (botón «Borrar todo» en Replays).</li>
          <li>Funciona con dobles de Showdown (VGC). Las Megas cuentan como su forma base en las estadísticas.</li>
          <li>Los datos se guardan solo en este navegador.</li>
        </ul>
      </Block>
    </div>
  );
}
