import { useState } from 'react';
import { replayIdFromUrl } from '@/lib/showdown/replay';
import { uid } from '@/state/team';
import type { Entry, Team } from '@/state/types';

interface AddReplaysProps {
  team: Team;
  canRead: boolean;
  onAdd: (entries: Entry[]) => void;
}

/** Extrae enlaces de repeticiones nuevos (sin repetir los que ya tiene el equipo). */
function newEntries(text: string, existing: Entry[]): { links: number; entries: Entry[] } {
  const known = new Set(existing.map((e) => replayIdFromUrl(e.url)));
  const links = text.split(/[\s,]+/).filter((l) => l.includes('replay.pokemonshowdown.com') && replayIdFromUrl(l));
  const entries: Entry[] = [];
  for (const url of links) {
    const id = replayIdFromUrl(url);
    if (known.has(id)) continue;
    known.add(id);
    entries.push({ id: uid(), url: url.trim(), note: '' });
  }
  return { links: links.length, entries };
}

export function AddReplays({ team, canRead, onAdd }: AddReplaysProps) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  const add = () => {
    const { links, entries } = newEntries(text, team.entries);
    if (entries.length) onAdd(entries);
    else setMsg(links ? 'Esas repeticiones ya están en este equipo.' : 'No encuentro enlaces de replay.pokemonshowdown.com en el texto.');
  };

  return (
    <div className="card add-replays">
      <h3>Añadir repeticiones</h3>
      <p className="muted small">Pega uno o varios enlaces de replay.pokemonshowdown.com, uno por línea. Se leen solos.</p>
      <textarea
        id="new-replays"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="https://replay.pokemonshowdown.com/gen9championsvgc2026regmcbo3-…"
        autoFocus
      />
      {!canRead && <p className="warn small">Antes pon tu nombre de Showdown arriba a la derecha; si no, no sé qué jugador eres.</p>}
      {msg && <p className="error small">{msg}</p>}
      <div className="actions">
        <button className="primary" onClick={add} disabled={!text.trim()}>
          Añadir
        </button>
      </div>
    </div>
  );
}
