import { useCallback, useEffect, useRef, useState } from 'react';
import type { PasteMon } from './paste';
import type { Game } from './replay';

export interface Entry {
  id: string;
  url: string;
  note: string;
  /** partida ya leída de Showdown (se guarda para no volver a descargarla) */
  game?: Game;
  error?: string;
}

export interface AppState {
  v: 2;
  names: string[];
  pasteUrl: string;
  team: PasteMon[];
  entries: Entry[];
  setNotes: Record<string, string>;
}

const KEY = 'laboratorio-vgc-v2';

export const emptyState = (): AppState => ({ v: 2, names: [], pasteUrl: '', team: [], entries: [], setNotes: {} });

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.v === 2) return { ...emptyState(), ...parsed };
    }
  } catch {
    /* almacenamiento bloqueado o JSON roto: empezamos vacíos */
  }
  return emptyState();
}

export type Updater = (fn: (draft: AppState) => void) => void;

/** Estado guardado en localStorage. `update` recibe una copia que se puede modificar. */
export function useAppState(): [AppState, Updater] {
  const [state, setState] = useState<AppState>(load);
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* sin espacio o almacenamiento bloqueado */
      }
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  const update = useCallback<Updater>((fn) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  return [state, update];
}

export const newEntryId = () => Math.random().toString(36).slice(2, 10);
