import { useState } from 'react';
import { fetchPaste, parsePaste } from '@/lib/showdown/paste';
import { createTeam } from '@/state/team';
import type { Team } from '@/state/types';

const defaultName = (species: string[]) => species.slice(0, 2).join(' + ') || 'Equipo nuevo';

interface NewTeamFormProps {
  onCreate: (team: Team) => void;
  onCancel?: () => void;
}

export function NewTeamForm({ onCreate, onCancel }: NewTeamFormProps) {
  const [mode, setMode] = useState<'link' | 'text'>('link');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'link') {
        const paste = await fetchPaste(url);
        const species = paste.team.map((m) => m.species);
        onCreate(createTeam(name.trim() || paste.title || defaultName(species), paste.team, url.trim(), paste.text));
      } else {
        const mons = parsePaste(text);
        if (!mons.length) throw new Error('No encuentro ningún Pokémon en el texto. Pega el equipo en formato Showdown.');
        onCreate(createTeam(name.trim() || defaultName(mons.map((m) => m.species)), mons, '', text));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ready = mode === 'link' ? url.trim() : text.trim();

  return (
    <form
      className="card new-team"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h3>Nuevo equipo</h3>
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'link'} onClick={() => setMode('link')}>
          Enlace de pokepast.es
        </button>
        <button type="button" role="tab" aria-selected={mode === 'text'} onClick={() => setMode('text')}>
          Pegar texto
        </button>
      </div>
      {mode === 'link' ? (
        <input id="paste-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://pokepast.es/…" autoFocus />
      ) : (
        <textarea
          id="paste-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={'Incineroar @ Sitrus Berry\nAbility: Intimidate\n- Fake Out\n…'}
        />
      )}
      <input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del equipo (opcional)" />
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="primary" type="submit" disabled={busy || !ready}>
          {busy ? 'Cargando…' : 'Crear equipo'}
        </button>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
