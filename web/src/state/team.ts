import type { PasteMon } from '@/lib/showdown/paste';
import type { Game } from '@/lib/showdown/replay';
import type { Team } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const createTeam = (name: string, mons: PasteMon[] = [], pasteUrl = '', pasteText = ''): Team => ({
  id: uid(),
  name,
  pasteUrl,
  pasteText,
  mons,
  entries: [],
  setNotes: {},
  created: Date.now(),
});

export const gamesOf = (team: Team): Game[] => team.entries.flatMap((e) => (e.game ? [e.game] : []));
