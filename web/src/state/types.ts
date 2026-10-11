import type { PasteMon } from '@/lib/showdown/paste';
import type { Game } from '@/lib/showdown/replay';

/** Un enlace de repetición guardado en un equipo. */
export interface Entry {
  id: string;
  url: string;
  note: string;
  /** partida ya leída de Showdown (se guarda para no volver a descargarla) */
  game?: Game;
  error?: string;
}

export interface Team {
  id: string;
  name: string;
  pasteUrl: string;
  pasteText: string;
  mons: PasteMon[];
  entries: Entry[];
  /** notas por set, con la clave de `groupSets` */
  setNotes: Record<string, string>;
  created: number;
}

export interface AppState {
  v: 3;
  /** tus nombres de Showdown */
  names: string[];
  teams: Team[];
}

/** Recibe una copia del estado que se puede modificar directamente. */
export type Updater = (fn: (draft: AppState) => void) => void;

export type TeamUpdater = (fn: (team: Team) => void) => void;
