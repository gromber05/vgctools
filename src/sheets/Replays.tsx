import { useState } from 'react';
import { Sprites } from '../components/ui';
import { replayIdFromUrl } from '../lib/replay';
import { newEntryId, type AppState, type Entry, type Updater } from '../lib/storage';

interface Props {
  state: AppState;
  update: Updater;
  loading: Set<string>;
  onLoad: (entries: Pick<Entry, 'id' | 'url'>[]) => void;
}

export function Replays({ state, update, loading, onLoad }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const pending = state.entries.filter((e) => !e.game && !loading.has(e.id));

  const add = () => {
    const known = new Set(state.entries.map((e) => replayIdFromUrl(e.url)));
    const links = text.split(/[\s,]+/).filter((l) => replayIdFromUrl(l));
    const fresh = links.filter((l) => !known.has(replayIdFromUrl(l)) && known.add(replayIdFromUrl(l)));
    if (!fresh.length) {
      setMsg(links.length ? 'Esas repeticiones ya estaban añadidas.' : 'No encontré enlaces de repeticiones de Showdown.');
      return;
    }
    const entries = fresh.map((url) => ({ id: newEntryId(), url: url.trim(), note: '' }));
    update((d) => {
      d.entries.push(...entries);
    });
    setText('');
    setMsg(`${entries.length} añadidas.${links.length > fresh.length ? ` ${links.length - fresh.length} repetidas ignoradas.` : ''}`);
    if (state.names.length) onLoad(entries);
  };

  return (
    <div className="sheet-grid">
      <div className="toolbar">
        <textarea id="new-links" value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí uno o varios enlaces de replay.pokemonshowdown.com (uno por línea)" rows={3} />
        <div className="toolbar-actions">
          <button className="primary" onClick={add} disabled={!text.trim()}>Añadir</button>
          <button onClick={() => onLoad(pending)} disabled={!pending.length || !state.names.length}>Leer pendientes ({pending.length})</button>
          <button onClick={() => onLoad(state.entries)} disabled={!state.entries.length || !state.names.length}>Volver a leer todas</button>
          {confirmClear ? (
            <span className="confirm">¿Borrar todas las repeticiones?
              <button className="danger" onClick={() => { update((d) => { d.entries = []; d.setNotes = {}; }); setConfirmClear(false); }}>Borrar</button>
              <button onClick={() => setConfirmClear(false)}>Cancelar</button>
            </span>
          ) : (
            <button className="ghost" onClick={() => setConfirmClear(true)} disabled={!state.entries.length}>Borrar todo</button>
          )}
        </div>
        {!state.names.length && <div className="hint warn">Pon tu nombre de Showdown en Inicio para poder leer las repeticiones.</div>}
        {msg && <div className="hint">{msg}</div>}
      </div>

      <div className="table-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th className="rownum">#</th>
              <th>Enlace</th>
              <th>Resultado</th>
              <th>Rival</th>
              <th>Equipo rival</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.entries.map((e, i) => (
              <tr key={e.id}>
                <td className="rownum">{i + 1}</td>
                <td className="link-cell"><a href={e.url} target="_blank" rel="noreferrer">{replayIdFromUrl(e.url)}</a></td>
                {loading.has(e.id) ? (
                  <td colSpan={3} className="muted">Leyendo…</td>
                ) : e.error ? (
                  <td colSpan={3} className="error">{e.error}</td>
                ) : e.game ? (
                  <>
                    <td className={`result r-${e.game.result}`}>{e.game.result === 'W' ? 'W' : e.game.result === 'L' ? 'L' : 'T'}</td>
                    <td>{e.game.opp}</td>
                    <td className="team-opp"><Sprites names={e.game.oppTeam} size={32} /></td>
                  </>
                ) : (
                  <td colSpan={3} className="muted">Pendiente</td>
                )}
                <td className="input-cell">
                  <input value={e.note} aria-label={`Notas de la partida ${i + 1}`} onChange={(ev) => { const v = ev.target.value; update((d) => { d.entries[i].note = v; }); }} />
                </td>
                <td>
                  <button className="ghost small" aria-label="Quitar" onClick={() => update((d) => { d.entries.splice(i, 1); })}>✕</button>
                </td>
              </tr>
            ))}
            {!state.entries.length && (
              <tr><td colSpan={7} className="muted center">Todavía no hay repeticiones. Pega enlaces arriba.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
