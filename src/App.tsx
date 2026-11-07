import type { ReactElement } from 'react';
import { IconBook, IconChart, IconDumbbell, IconHome } from './components/icons';
import { ToastHost } from './components/ui';
import { saveSettings } from './db/queries';
import { PlanScreen } from './screens/Plan';
import { ProgressScreen } from './screens/Progress';
import { TodayScreen } from './screens/Today';
import { Welcome } from './screens/Welcome';
import { WorkoutScreen } from './screens/Workout';
import { AppProvider, useApp, type Tab } from './state';

const TABS: { id: Tab; label: string; icon: ReactElement }[] = [
  { id: 'today', label: 'Home', icon: <IconHome /> },
  { id: 'workout', label: 'Workout', icon: <IconDumbbell /> },
  { id: 'progress', label: 'Stats', icon: <IconChart /> },
  { id: 'plan', label: 'Plan', icon: <IconBook /> },
];

function Shell() {
  const { tab, setTab, settings } = useApp();
  if (!settings.welcomed) return <Welcome onStart={() => void saveSettings({ welcomed: true })} />;
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
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? ' on' : ''}`}
              aria-label={t.label}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
            >
              <span className="bubble">{t.icon}</span>
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
