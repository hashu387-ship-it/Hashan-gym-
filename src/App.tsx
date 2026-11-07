import { ToastHost } from './components/ui';
import { PlanScreen } from './screens/Plan';
import { ProgressScreen } from './screens/Progress';
import { TodayScreen } from './screens/Today';
import { WorkoutScreen } from './screens/Workout';
import { AppProvider, useApp, type Tab } from './state';

const ICONS: Record<Tab, JSX.Element> = {
  today: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  workout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h6M8 11h6" />
    </svg>
  ),
};
const LABELS: Record<Tab, string> = { today: 'Today', workout: 'Workout', progress: 'Progress', plan: 'Plan' };

function Shell() {
  const { tab, setTab } = useApp();
  return (
    <>
      <main className="app">
        {tab === 'today' && <TodayScreen />}
        {tab === 'workout' && <WorkoutScreen />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'plan' && <PlanScreen />}
      </main>
      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          {(Object.keys(LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab${tab === t ? ' on' : ''}`}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => {
                setTab(t);
                window.scrollTo({ top: 0 });
              }}
            >
              {ICONS[t]}
              {LABELS[t]}
            </button>
          ))}
        </div>
      </nav>
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
