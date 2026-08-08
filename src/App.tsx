import { useCallback, useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { RestBar } from './components/RestBar';
import { Toast } from './components/Primitives';
import { scheduleReminders } from './lib/reminders';
import { Body } from './screens/Body';
import { Completion } from './screens/Completion';
import { Plan } from './screens/Plan';
import { Progress } from './screens/Progress';
import { SessionView } from './screens/SessionView';
import { Today } from './screens/Today';
import { useStore } from './store/useStore';

type Tab = 'today' | 'progress' | 'body' | 'plan';

const TABS: { id: Tab; label: string; icon: 'today' | 'chart' | 'body' | 'plan' }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'body', label: 'Body', icon: 'body' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
];

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const [tab, setTab] = useState<Tab>('today');
  const [training, setTraining] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Reminders are re-derived whenever the plan or the log changes, so a
  // finished session silently cancels its own nudge.
  useEffect(() => {
    if (!hydrated) return;
    const run = () => scheduleReminders(useStore.getState());
    run();
    document.addEventListener('visibilitychange', run);
    return () => document.removeEventListener('visibilitychange', run);
  }, [hydrated, settings, sessions]);

  // Resume an interrupted session rather than stranding it.
  useEffect(() => {
    if (hydrated && activeSessionId) setTraining(activeSessionId);
  }, [hydrated, activeSessionId]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  if (!hydrated) {
    return (
      <div className="splash">
        <div className="splash__mark">Lift</div>
      </div>
    );
  }

  if (completed) {
    return <Completion sessionId={completed} onDone={() => setCompleted(null)} />;
  }

  if (training) {
    return (
      <SessionView
        sessionId={training}
        onFinished={(id) => {
          setTraining(null);
          setCompleted(id);
        }}
        onExit={() => {
          useStore.getState().abandonSession(training);
          setTraining(null);
        }}
      />
    );
  }

  return (
    <div className="app">
      {tab === 'today' ? (
        <Today
          onStart={(id) => setTraining(id)}
          onNavigate={(t) => setTab(t)}
        />
      ) : null}
      {tab === 'progress' ? <Progress /> : null}
      {tab === 'body' ? <Body /> : null}
      {tab === 'plan' ? <Plan onToast={showToast} /> : null}

      <RestBar />

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar__inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'tab--on' : ''}`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={21} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
