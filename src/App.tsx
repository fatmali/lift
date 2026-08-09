import { useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { RestBar } from './components/RestBar';
import { scheduleReminders } from './lib/reminders';
import { Body } from './screens/Body';
import { CircuitCompletion } from './screens/CircuitCompletion';
import { CircuitSession } from './screens/CircuitSession';
import { Completion } from './screens/Completion';
import { Fasting } from './screens/Fasting';
import { Library } from './screens/Library';
import { Meals } from './screens/Meals';
import { Plan } from './screens/Plan';
import { PlanEditor } from './screens/PlanEditor';
import { Progress } from './screens/Progress';
import { Recipe } from './screens/Recipe';
import { SessionView } from './screens/SessionView';
import { Shopping } from './screens/Shopping';
import { StrengthSessions } from './screens/StrengthSessions';
import { Today } from './screens/Today';
import { useCircuitStore } from './store/useCircuitStore';
import { useStore } from './store/useStore';

/**
 * Three destinations, not four. Body lives inside Progress and nutrition
 * lives inside Today and Plan, so the app has fewer places to be rather
 * than more.
 */
type Tab = 'today' | 'progress' | 'plan';

const TABS: { id: Tab; label: string; icon: 'today' | 'chart' | 'plan' }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
];

/** Screens pushed on top of a tab, rather than being destinations of their own. */
type Sub =
  | { kind: 'meals' }
  | { kind: 'recipe'; recipeId: string; from: 'meals' | 'today' }
  | { kind: 'shopping'; from: 'meals' | 'plan' }
  | { kind: 'planEditor'; workoutId: string }
  | { kind: 'strength' }
  | { kind: 'library' }
  | { kind: 'fasting' }
  | { kind: 'body' };

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const circuitHydrated = useCircuitStore((s) => s.hydrated);
  const activeCircuitSessionId = useCircuitStore((s) => s.activeSessionId);

  const [tab, setTab] = useState<Tab>('today');
  const [sub, setSub] = useState<Sub | null>(null);
  const [training, setTraining] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);
  const [circuitTraining, setCircuitTraining] = useState<string | null>(null);
  const [circuitCompleted, setCircuitCompleted] = useState<string | null>(null);

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

  useEffect(() => {
    if (circuitHydrated && activeCircuitSessionId) setCircuitTraining(activeCircuitSessionId);
  }, [circuitHydrated, activeCircuitSessionId]);

  const go = (t: Tab) => {
    setSub(null);
    setTab(t);
  };

  if (!hydrated || !circuitHydrated) {
    return (
      <div className="splash">
        <div className="splash__mark">Lift</div>
      </div>
    );
  }

  if (circuitCompleted) {
    return <CircuitCompletion sessionId={circuitCompleted} onDone={() => setCircuitCompleted(null)} />;
  }

  if (circuitTraining) {
    return (
      <CircuitSession
        sessionId={circuitTraining}
        onFinished={(id) => {
          setCircuitTraining(null);
          setCircuitCompleted(id);
        }}
        onExit={() => {
          useCircuitStore.getState().abandonSession(circuitTraining);
          setCircuitTraining(null);
        }}
      />
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
      {sub === null && tab === 'today' ? (
        <Today
          onStart={(id) => setCircuitTraining(id)}
          onViewMeals={() => setSub({ kind: 'meals' })}
          onViewWorkout={(workoutId) => {
            setTab('plan');
            setSub({ kind: 'planEditor', workoutId });
          }}
        />
      ) : null}

      {sub === null && tab === 'progress' ? (
        <Progress onLogBody={() => setSub({ kind: 'body' })} />
      ) : null}

      {sub === null && tab === 'plan' ? (
        <Plan
          onEditWorkout={(workoutId) => setSub({ kind: 'planEditor', workoutId })}
          onViewMeals={() => setSub({ kind: 'meals' })}
          onViewShopping={() => setSub({ kind: 'shopping', from: 'plan' })}
          onViewStrength={() => setSub({ kind: 'strength' })}
          onViewLibrary={() => setSub({ kind: 'library' })}
          onViewFasting={() => setSub({ kind: 'fasting' })}
        />
      ) : null}

      {sub?.kind === 'meals' ? (
        <Meals
          onBack={() => setSub(null)}
          onOpenRecipe={(recipeId) => setSub({ kind: 'recipe', recipeId, from: 'meals' })}
          onViewShopping={() => setSub({ kind: 'shopping', from: 'meals' })}
        />
      ) : null}

      {sub?.kind === 'recipe' ? (
        <Recipe
          recipeId={sub.recipeId}
          onBack={() => setSub(sub.from === 'meals' ? { kind: 'meals' } : null)}
          onViewShopping={() => setSub({ kind: 'shopping', from: 'meals' })}
        />
      ) : null}

      {sub?.kind === 'shopping' ? (
        <Shopping onBack={() => setSub(sub.from === 'meals' ? { kind: 'meals' } : null)} />
      ) : null}

      {sub?.kind === 'planEditor' ? (
        <PlanEditor workoutId={sub.workoutId} onDone={() => setSub(null)} />
      ) : null}

      {sub?.kind === 'strength' ? (
        <StrengthSessions onBack={() => setSub(null)} onStart={(id) => setTraining(id)} />
      ) : null}

      {sub?.kind === 'library' ? <Library onBack={() => setSub(null)} /> : null}
      {sub?.kind === 'fasting' ? <Fasting onBack={() => setSub(null)} /> : null}
      {sub?.kind === 'body' ? <Body onBack={() => setSub(null)} /> : null}

      <RestBar />

      {/* Both navigations are rendered; CSS shows whichever suits the width. */}
      <nav className="sidenav" aria-label="Main">
        <div className="sidenav__brand">
          <Icon name="bolt" size={17} />
          Lift
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sidelink ${tab === t.id ? 'sidelink--on' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => go(t.id)}
          >
            <Icon name={t.icon} size={18} />
            {t.label}
          </button>
        ))}
      </nav>

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar__inner tabbar__inner--three">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'tab--on' : ''}`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => go(t.id)}
            >
              <Icon name={t.icon} size={21} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
