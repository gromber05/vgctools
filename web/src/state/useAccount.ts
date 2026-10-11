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
  loadError: string;
  localTeams: Team[];
  importLocalTeams: () => void;
  dismissLocalTeams: () => void;
  signIn: (mode: 'login' | 'register', username: string, password: string, acceptTerms?: boolean) => Promise<void>;
  signOut: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  exportData: () => Promise<void>;
  retry: () => void;
}

const emptyState = (): AppState => ({ v: 3, names: [], teams: [] });

export function useAccount(): Account {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>(emptyState);
  const [status, setStatus] = useState<AccountStatus>(token ? 'loading' : 'anon');
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

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

  const signIn = useCallback(async (mode: 'login' | 'register', username: string, password: string, acceptTerms = false) => {
    const session: Session = await (mode === 'login' ? api.login(username, password) : api.register(username, password, acceptTerms));
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
    changePassword: async (currentPassword, newPassword) => {
      if (!token) return;
      const session = await api.changePassword(token, currentPassword, newPassword);
      writeToken(session.accessToken);
      setToken(session.accessToken);
    },
    exportData: async () => {
      if (!token) return;
      const data = await api.exportData(token);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vgc-tools-${user?.username ?? 'datos'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    deleteAccount: async (password) => {
      if (!token) return;
      await api.deleteAccount(token, password);
      signOut();
    },
    retry: () => {
      setStatus('loading');
      setReloadKey((k) => k + 1);
    },
  };
}
