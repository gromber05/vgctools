import type { PasteMon } from '@/lib/showdown/paste';
import { createTeam } from './team';
import type { Entry, Team } from './types';

const TOKEN_KEY = 'vgc-tools-token';

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

const LOCAL_KEY = 'vgc-tools-v3';
const LEGACY_KEY = 'laboratorio-vgc-v2';

interface LegacyState {
  pasteUrl?: string;
  team?: Partial<PasteMon>[];
  entries?: Entry[];
  setNotes?: Record<string, string>;
}

function fromLegacy(old: LegacyState): Team[] {
  const mons = (old.team ?? []).map((m) => ({ species: '', nickname: '', item: '', ability: '', nature: '', evs: '', moves: [], ...m }));
  const team = { ...createTeam('Mi equipo', mons, old.pasteUrl ?? ''), entries: old.entries ?? [], setNotes: old.setNotes ?? {} };
  return team.mons.length || team.entries.length ? [team] : [];
}

export function readLocalTeams(): Team[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { teams?: Team[] };
      if (Array.isArray(parsed.teams)) return parsed.teams;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return fromLegacy(JSON.parse(legacy) as LegacyState);
  } catch {}
  return [];
}

export function clearLocalTeams() {
  try {
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
