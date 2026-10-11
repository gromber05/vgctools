import { useCallback, useState } from 'react';
import { fetchReplay, parseReplay } from '@/lib/showdown/replay';
import type { Entry, Updater } from './types';

const CONCURRENCY = 4;

export type LoadReplays = (teamId: string, entries: Pick<Entry, 'id' | 'url'>[]) => Promise<void>;

/** Descarga y analiza repeticiones de Showdown, varias a la vez, y guarda el resultado en su equipo. */
export function useReplayLoader(names: string[], update: Updater): [Set<string>, LoadReplays] {
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const load = useCallback<LoadReplays>(
    async (teamId, list) => {
      const queue = [...list];
      setLoading((l) => new Set([...l, ...list.map((e) => e.id)]));

      const save = (entryId: string, patch: Partial<Entry>) =>
        update((d) => {
          const entry = d.teams.find((t) => t.id === teamId)?.entries.find((e) => e.id === entryId);
          if (!entry) return;
          delete entry.game;
          delete entry.error;
          Object.assign(entry, patch);
        });

      const worker = async () => {
        for (let entry = queue.shift(); entry; entry = queue.shift()) {
          try {
            save(entry.id, { game: parseReplay(await fetchReplay(entry.url), names) });
          } catch (err) {
            save(entry.id, { error: (err as Error).message || 'No se pudo leer la repetición.' });
          }
          const done = entry.id;
          setLoading((l) => {
            const next = new Set(l);
            next.delete(done);
            return next;
          });
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    },
    [names, update],
  );

  return [loading, load];
}
