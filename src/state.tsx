import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { db } from './db/db';
import { applyBandData, getSettings, saveSettings } from './db/queries';
import { todayRiyadh } from './logic/dates';
import type { Settings } from './plan/types';
import { fetchBandDays, SyncError, type SyncErrorKind } from './sync/client';

export type Tab = 'today' | 'workout' | 'progress' | 'plan';

export interface SyncState {
  status: 'idle' | 'syncing' | 'ok' | 'error';
  error?: SyncErrorKind;
}

interface AppState {
  settings: Settings;
  date: string;
  setDate: (d: string) => void;
  today: string;
  tab: Tab;
  setTab: (t: Tab) => void;
  sync: SyncState;
  syncNow: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

const SYNC_EVERY_MS = 15 * 60 * 1000;
const QUIET: SyncErrorKind[] = ['not_connected', 'not_configured'];

export function AppProvider({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get('main'), []);
  const [today, setToday] = useState(() => todayRiyadh());
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<Tab>('today');
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const running = useRef(false);

  useEffect(() => {
    void getSettings();
  }, []);

  // Roll over to the new day when the app stays open past midnight.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = todayRiyadh();
      setToday((prev) => {
        if (prev !== t) setDate((d) => (d === prev ? t : d));
        return t;
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const syncNow = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSync({ status: 'syncing' });
    try {
      const days = await fetchBandDays(14);
      await applyBandData(days);
      await saveSettings({ lastSyncAt: new Date().toISOString() });
      setSync({ status: 'ok' });
    } catch (e) {
      const kind = e instanceof SyncError ? e.kind : 'google';
      setSync({ status: QUIET.includes(kind) ? 'idle' : 'error', error: kind });
    } finally {
      running.current = false;
    }
  }, []);

  // Sync on open (and when coming back to the app) if the last sync is old.
  const lastSyncAt = settings?.lastSyncAt;
  useEffect(() => {
    if (!settings) return;
    const params = new URLSearchParams(window.location.search);
    const justConnected = params.has('connected');
    if (justConnected) window.history.replaceState(null, '', window.location.pathname);
    const maybeSync = () => {
      const stale = !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() > SYNC_EVERY_MS;
      if (justConnected || stale) void syncNow();
    };
    maybeSync();
    const onVisible = () => document.visibilityState === 'visible' && maybeSync();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(settings), lastSyncAt, syncNow]);

  if (!settings) return <div className="app"><p className="muted">Loading...</p></div>;

  return (
    <Ctx.Provider value={{ settings, date, setDate, today, tab, setTab, sync, syncNow }}>
      {children}
    </Ctx.Provider>
  );
}
