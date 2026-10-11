import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { api, type Session, type User } from '@/api/endpoints';
import { clearLocalTeams, readLocalTeams, readToken, writeToken } from './persistence';
import { diffState, type SyncOp } from './sync';
import type { AppState, Team, Updater } from './types';

const SYNC_DELAY_MS = 700;

export type AccountStatus = 'anon' | 'loading' | 'ready' | 'error';
export type SaveStatus = 'saved' | 'saving' | 'error';

export interface Account {
  status: AccountStatus;
  user: User | null;
  state: AppState;
  update: Updater;
  saveStatus: SaveStatus;
  /** mensaje si no se pudieron cargar los datos */
  loadError: string;
  /** equipos que quedaron en este navegador de antes de tener cuenta */
  localTeams: Team[];
  importLocalTeams: () => void;
  dismissLocalTeams: () => void;
  signIn: (mode: 'login' | 'register', username: string, password: string) => Promise<void>;
  signOut: () => void;
  retry: () => void;
}

const emptyState = (): AppState => ({ v: 3, names: [], teams: [] });

/**
 * Sesión del usuario y sus datos. Los cambios hechos con `update` se guardan solos en el
 * servidor poco después (se agrupan los cambios seguidos en un solo envío).
 */
export function useAccount(): Account {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>(emptyState);
  const [status, setStatus] = useState<AccountStatus>(token ? 'loading' : 'anon');
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Lo último que el servidor tiene guardado; se compara con el estado para saber qué enviar.
  const synced = useRef<AppState>(emptyState());
  const latest = useRef(state);
  const syncing = useRef(false);
  const pending = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
    setState(emptyState());
    synced.current = emptyState();
    setStatus('anon');
  }, []);

  // Carga la cuenta y sus equipos cuando hay token.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([api.me(token), api.listTeams(token)])
      .then(([me, teams]) => {
        if (cancelled) return;
        const loaded: AppState = { v: 3, names: me.showdownNames, teams };
        synced.current = loaded;
        setUser(me);
        setState(loaded);
        setLocalTeams(teams.length ? [] : readLocalTeams());
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) signOut();
        else {
          setLoadError((err as Error).message);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey, signOut]);

  const run = useCallback(
    async (op: SyncOp) => {
      if (!token) return;
      if (op.kind === 'names') await api.updateMe(token, op.names);
      else if (op.kind === 'save') await api.saveTeam(token, op.team);
      else await api.deleteTeam(token, op.teamId);
    },
    [token],
  );

  const flush = useCallback(async () => {
    if (syncing.current) {
      pending.current = true;
      return;
    }
    syncing.current = true;
    try {
      // Si llegan cambios mientras se guarda, se repite hasta alcanzar el último estado.
      do {
        pending.current = false;
        const target = latest.current;
        for (const op of diffState(synced.current, target)) await run(op);
        synced.current = target;
      } while (pending.current);
      setSaveStatus(latest.current === synced.current ? 'saved' : 'saving');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signOut();
      else setSaveStatus('error');
    } finally {
      syncing.current = false;
    }
  }, [run, signOut]);

  // Cada cambio programa un guardado.
  useEffect(() => {
    latest.current = state;
    if (status !== 'ready' || state === synced.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSaveStatus('saving');
      void flush();
    }, SYNC_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [state, status, flush]);

  const update = useCallback<Updater>((fn) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const signIn = useCallback(async (mode: 'login' | 'register', username: string, password: string) => {
    const session: Session = await (mode === 'login' ? api.login(username, password) : api.register(username, password));
    writeToken(session.accessToken);
    setLoadError('');
    setStatus('loading');
    setToken(session.accessToken);
  }, []);

  return {
    status,
    user,
    state,
    update,
    saveStatus,
    loadError,
    localTeams,
    importLocalTeams: () => {
      const ids = new Set(state.teams.map((t) => t.id));
      update((d) => {
        d.teams.push(...localTeams.filter((t) => !ids.has(t.id)));
      });
      clearLocalTeams();
      setLocalTeams([]);
    },
    dismissLocalTeams: () => setLocalTeams([]),
    signIn,
    signOut,
    retry: () => {
      setStatus('loading');
      setReloadKey((k) => k + 1);
    },
  };
}
