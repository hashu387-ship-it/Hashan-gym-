import { useRef, useState } from 'react';
import planDoc from '../../docs/health-plan.md?raw';
import setupDoc from '../../docs/google-health-setup.md?raw';
import { HowTo } from '../components/ExerciseDemo';
import { Markdown, splitSections } from '../components/Markdown';
import { NumInput, Sheet, showToast, timeAgo } from '../components/ui';
import { backupCounts, backupFileName, exportBackup, importBackup, validateBackup } from '../db/backup';
import { saveSettings } from '../db/queries';
import { dayContext } from '../logic/context';
import { isValidDate } from '../logic/dates';
import { EXERCISE_BY_ID, demoFrames } from '../plan/exercises';
import { SESSIONS, WEEK_SCHEDULE } from '../plan/program';
import type { ExerciseInfo, Settings } from '../plan/types';
import { useApp } from '../state';
import { SYNC_MESSAGES, connectFitbit, disconnectFitbit, pairWithCode } from '../sync/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PlanScreen() {
  const { settings, today } = useApp();
  const ctx = dayContext(today, settings);
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null);
  const sections = splitSections(planDoc).filter(([t]) => t);

  return (
    <div>
      <h1>Plan</h1>
      <p className="muted small" style={{ marginTop: 4 }}>Today: {ctx.label}. Everything here works offline.</p>

      <details className="sec" open>
        <summary>Exercises and how to do them</summary>
        <div className="body">
          <p className="small muted">Tap any exercise to see a moving demo, the steps and the common mistakes.</p>
          {WEEK_SCHEDULE.map((id, wd) => {
            const s = SESSIONS[id];
            if (s.items.length === 0) return <p key={wd} className="small"><strong>{DAY_NAMES[wd]}:</strong> {s.title}</p>;
            return (
              <div key={wd} style={{ marginTop: 12 }}>
                <h3>{DAY_NAMES[wd]}: {s.title} <span className="muted small">- {s.focus}</span></h3>
                <ul className="list">
                  {s.items.map((it, i) => {
                    const ex = EXERCISE_BY_ID[settings.swaps[it.exerciseId] ?? it.exerciseId];
                    return (
                      <li key={i}>
                        <img className="ex-thumb" src={demoFrames(ex)[1]} alt="" loading="lazy" />
                        <span className="grow small">{ex.name}{it.main && <strong> (main)</strong>}</span>
                        <button className="btn secondary small" onClick={() => setHowTo(ex)}>How to</button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </details>

      {sections.map(([title, body]) => (
        <details className="sec" key={title}>
          <summary>{title.replace(/^\d+\.\s*/, '')}</summary>
          <div className="body"><Markdown source={body} /></div>
        </details>
      ))}

      <h2 style={{ marginTop: 24 }}>Settings</h2>
      <FitbitSettings />
      <BackupSettings />
      <CalendarSettings />
      <TargetSettings settings={settings} />

      <details className="sec">
        <summary>Fitbit setup guide</summary>
        <div className="body"><Markdown source={setupDoc} /></div>
      </details>

      <p className="tiny muted" style={{ marginTop: 16 }}>
        Exercise photos: Free Exercise DB (public domain). This plan is general fitness guidance, not medical advice.
      </p>

      {howTo && <Sheet title={howTo.name} onClose={() => setHowTo(null)}><HowTo exercise={howTo} /></Sheet>}
    </div>
  );
}

function FitbitSettings() {
  const { settings, sync, syncNow } = useApp();
  const [pairing, setPairing] = useState(false);
  const [code, setCode] = useState('');
  const connected = !!settings.lastSyncAt && sync.error !== 'not_connected' && sync.error !== 'reconnect';
  const status = sync.status === 'syncing'
    ? 'Syncing...'
    : sync.error ? SYNC_MESSAGES[sync.error]
    : settings.lastSyncAt ? `Connected. Last sync ${timeAgo(settings.lastSyncAt)}.` : 'Not connected yet.';

  return (
    <section className="card" aria-label="Fitbit">
      <h2>Fitbit Air</h2>
      <p className="small">{status}</p>
      <p className="small muted">First time? Follow the Fitbit setup guide at the bottom of this page (about 20 minutes, once).</p>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="btn" onClick={connectFitbit}>{connected ? 'Reconnect' : 'Connect Fitbit'}</button>
        <button className="btn secondary" disabled={sync.status === 'syncing'} onClick={() => void syncNow()}>Sync now</button>
        <button className="btn secondary" onClick={() => setPairing(true)}>Paste pairing code</button>
        {connected && (
          <button className="btn danger" onClick={async () => {
            await disconnectFitbit();
            await saveSettings({ lastSyncAt: undefined });
            showToast('Fitbit disconnected');
          }}>Disconnect</button>
        )}
      </div>
      {pairing && (
        <Sheet title="Paste pairing code" onClose={() => setPairing(false)}>
          <p className="small muted">Use this if Google sign-in finished in Safari. Copy the code from that page and paste it here. It works for 15 minutes.</p>
          <textarea aria-label="Pairing code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code" />
          <button className="btn block" style={{ marginTop: 10 }} disabled={!code.trim()} onClick={async () => {
            try {
              await pairWithCode(code.trim());
              setPairing(false);
              setCode('');
              showToast('Fitbit connected');
              void syncNow();
            } catch (e) {
              showToast((e as Error).message);
            }
          }}>Connect</button>
        </Sheet>
      )}
    </section>
  );
}

function BackupSettings() {
  const { settings } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: unknown; summary: string } | null>(null);

  const doExport = async () => {
    const data = await exportBackup();
    const file = new File([JSON.stringify(data)], backupFileName(), { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Hashan Fit backup' });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      await saveSettings({ lastBackupAt: new Date().toISOString() });
      showToast('Backup saved');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') showToast('Backup failed. Try again.');
    }
  };

  return (
    <section className="card" aria-label="Backup">
      <h2>Backup</h2>
      <p className="small muted">
        Your data lives only on this phone. Save a backup to iCloud Drive (Files) every week.
        {settings.lastBackupAt ? ` Last backup ${timeAgo(settings.lastBackupAt)}.` : ' No backup yet.'}
      </p>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="btn" onClick={doExport}>Save backup</button>
        <button className="btn secondary" onClick={() => fileRef.current?.click()}>Restore backup</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const data = JSON.parse(await f.text());
            const c = backupCounts(validateBackup(data));
            setPending({ data, summary: `${c.days} days, ${c.weighIns} weigh-ins, ${c.workouts} workouts` });
          } catch (err) {
            showToast(err instanceof SyntaxError ? 'This file is not a Hashan Fit backup.' : (err as Error).message);
          }
        }} />
      </div>
      {pending && (
        <Sheet title="Restore backup?" onClose={() => setPending(null)}>
          <p>This backup has {pending.summary}.</p>
          <p className="small muted">Restoring replaces everything in the app now.</p>
          <div className="row">
            <button className="btn" onClick={async () => {
              await importBackup(pending.data);
              setPending(null);
              showToast('Backup restored');
            }}>Restore</button>
            <button className="btn secondary" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function CalendarSettings() {
  return (
    <section className="card" aria-label="Calendar">
      <h2>Calendar reminders</h2>
      <p className="small muted">Adds repeating events with alerts to your iPhone Calendar: wake, meals, Lipo 6, gym, wind down, sleep and the Friday weigh-in. On iPhone, tap the link and choose Add All.</p>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <a className="btn" href="/work-days.ics">Add work-day schedule</a>
        <a className="btn secondary" href="/ramadan.ics">Add Ramadan schedule</a>
      </div>
    </section>
  );
}

function TargetSettings({ settings }: { settings: Settings }) {
  const [draft, setDraft] = useState(settings);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const datesOk = [draft.lipoEndDate, draft.ramadanStart, draft.ramadanEnd].every(isValidDate) && draft.ramadanStart <= draft.ramadanEnd;

  return (
    <section className="card" aria-label="Targets and dates">
      <h2>Targets and dates</h2>
      <div className="grid2">
        <label className="field">Calories (kcal)<NumInput ariaLabel="Calorie target" value={draft.kcalTarget} onChange={(v) => v !== undefined && set('kcalTarget', v)} step="10" min={1600} /></label>
        <label className="field">Protein (g)<NumInput ariaLabel="Protein target" value={draft.proteinTarget} onChange={(v) => v !== undefined && set('proteinTarget', v)} step="5" /></label>
        <label className="field">Extra steps<NumInput ariaLabel="Extra steps" value={draft.stepsBonus} onChange={(v) => set('stepsBonus', v ?? 0)} step="500" /></label>
        <label className="field">Start weight (kg)<NumInput ariaLabel="Start weight" value={draft.startWeightKg} onChange={(v) => v !== undefined && set('startWeightKg', v)} step="0.1" /></label>
      </div>
      <h3 style={{ marginTop: 14 }}>Lipo 6</h3>
      <div className="grid2">
        <label className="field">Show reminder
          <select value={draft.lipoEnabled ? 'on' : 'off'} onChange={(e) => set('lipoEnabled', e.target.value === 'on')}>
            <option value="on">On</option><option value="off">Off (stopped)</option>
          </select>
        </label>
        <label className="field">Last day<input type="date" value={draft.lipoEndDate} onChange={(e) => set('lipoEndDate', e.target.value)} /></label>
      </div>
      <h3 style={{ marginTop: 14 }}>Ramadan (move if the moon sighting changes it)</h3>
      <div className="grid2">
        <label className="field">First day<input type="date" value={draft.ramadanStart} onChange={(e) => set('ramadanStart', e.target.value)} /></label>
        <label className="field">Last day<input type="date" value={draft.ramadanEnd} onChange={(e) => set('ramadanEnd', e.target.value)} /></label>
      </div>
      <h3 style={{ marginTop: 14 }}>Usual breakfast</h3>
      {draft.defaultBreakfast.map((b, i) => (
        <div key={i} className="grid3" style={{ marginTop: 6, alignItems: 'end' }}>
          <label className="field">{b.name}<NumInput ariaLabel={`${b.name} amount`} value={b.qty} step="0.5" min={0}
            onChange={(v) => set('defaultBreakfast', draft.defaultBreakfast.map((x, j) => (j === i ? { ...x, qty: v ?? 0 } : x)))} /></label>
          <label className="field">kcal each<NumInput ariaLabel={`${b.name} kcal`} value={b.kcal} step="5" min={0}
            onChange={(v) => set('defaultBreakfast', draft.defaultBreakfast.map((x, j) => (j === i ? { ...x, kcal: v ?? 0 } : x)))} /></label>
          <label className="field">Protein g<NumInput ariaLabel={`${b.name} protein`} value={b.protein} step="0.5" min={0}
            onChange={(v) => set('defaultBreakfast', draft.defaultBreakfast.map((x, j) => (j === i ? { ...x, protein: v ?? 0 } : x)))} /></label>
        </div>
      ))}
      {!datesOk && <div className="banner bad">Check the dates. Ramadan's first day must be before its last day.</div>}
      <button className="btn block" style={{ marginTop: 14 }} disabled={!datesOk} onClick={async () => {
        await saveSettings({ ...draft, kcalTarget: Math.max(1600, draft.kcalTarget) });
        showToast('Settings saved');
      }}>Save settings</button>
    </section>
  );
}
