import { useState } from 'react';
import { DataLists } from '@/components/pokemon/DataLists';
import { exportPaste, parsePaste, type PasteMon } from '@/lib/showdown/paste';
import type { Team, TeamUpdater } from '@/state/types';
import { SetEditor } from '../components/SetEditor';
import { TeamTypeAnalysis } from '../components/TeamTypeAnalysis';

const MAX_MONS = 6;

const emptyMon = (): PasteMon => ({ species: '', nickname: '', item: '', ability: '', nature: 'Hardy', evs: '', moves: ['', '', '', ''] });

export function BuilderSection({ team, updateTeam }: { team: Team; updateTeam: TeamUpdater }) {
  const [io, setIo] = useState(false);

  const saveMons = (mons: PasteMon[]) =>
    updateTeam((t) => {
      t.mons = mons;
      t.pasteText = exportPaste(mons);
    });

  return (
    <div className="builder">
      <DataLists />
      <div className="toolbar">
        <p className="muted small">
          Nivel 50 y IVs al máximo. Reparte hasta 66 Stat Points, con un máximo de 32 por estadística. Los cambios se guardan solos.
        </p>
        <div className="toolbar-actions">
          {team.mons.length < MAX_MONS && <button onClick={() => saveMons([...team.mons, emptyMon()])}>Añadir Pokémon</button>}
          <button className="ghost" onClick={() => setIo((v) => !v)}>
            {io ? 'Cerrar' : 'Importar / exportar'}
          </button>
        </div>
      </div>

      {io && <ImportExport mons={team.mons} onImport={saveMons} />}

      <div className="set-grid">
        {team.mons.map((mon, i) => (
          <SetEditor
            key={i}
            index={i}
            mon={mon}
            team={team.mons}
            onChange={(next) => saveMons(team.mons.map((m, j) => (j === i ? next : m)))}
            onRemove={() => saveMons(team.mons.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      <TeamTypeAnalysis mons={team.mons} />
    </div>
  );
}

function ImportExport({ mons, onImport }: { mons: PasteMon[]; onImport: (mons: PasteMon[]) => void }) {
  const [text, setText] = useState(() => exportPaste(mons));
  const [msg, setMsg] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg('Copiado.');
    } catch {
      setMsg('No se pudo copiar: selecciona el texto y cópialo a mano.');
    }
  };

  const doImport = () => {
    const parsed = parsePaste(text).slice(0, MAX_MONS);
    if (!parsed.length) return setMsg('No encuentro ningún Pokémon en el texto.');
    onImport(parsed);
    setMsg(`Importados ${parsed.length} Pokémon.`);
  };

  return (
    <div className="card io-panel">
      <p className="muted small">
        Formato de Showdown. La línea <b>EVs</b> lleva Stat Points; si pegas EVs clásicos (hasta 252), se convierten solos.
      </p>
      <textarea id="paste-io" rows={14} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <div className="actions">
        <button className="primary" onClick={doImport}>
          Sustituir el equipo por este texto
        </button>
        <button onClick={copy}>Copiar</button>
        {msg && <span className="muted small">{msg}</span>}
      </div>
    </div>
  );
}
