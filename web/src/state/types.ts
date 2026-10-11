import type { PasteMon } from '@/lib/showdown/paste';
import type { Game } from '@/lib/showdown/replay';

export interface Entry {
  id: string;
  url: string;
  note: string;
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
  setNotes: Record<string, string>;
  created: number;
}

export interface AppState {
  v: 3;
  names: string[];
  teams: Team[];
}

export type Updater = (fn: (draft: AppState) => void) => void;

export type TeamUpdater = (fn: (team: Team) => void) => void;
