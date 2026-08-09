import { Icon } from '../components/Icon';
import { getExercise } from '../data/exercises';
import { PROGRAM } from '../data/program';
import { lastPerformance, topWeight } from '../domain/progression';
import { today as todayISO } from '../lib/date';
import { num, plural } from '../lib/format';
import { useStore } from '../store/useStore';
import type { DayId } from '../types';

/**
 * Strength mode: the traditional exercise-by-exercise, set-by-set pattern.
 * Functional days never see this — it is here for the days that want the
 * detail, and it runs the app's full logger rather than a simplified copy.
 */
export function StrengthSessions({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (sessionId: string) => void;
}) {
  const store = useStore();
  const now = todayISO();

  const start = (dayId: DayId) => onStart(store.resumeOrStart(dayId, now));

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Plan
      </button>

      <header className="screen-head" style={{ marginTop: 24 }}>
        <div>
          <div className="screen-head__eyebrow">Strength sessions</div>
          <h1>Traditional sets</h1>
        </div>
      </header>

      <p className="small muted" style={{ maxWidth: '36ch' }}>
        Exercise by exercise, set by set, with weight and reps logged for each. Pick one when you
        want the detail — your functional week is untouched.
      </p>

      <div className="planlist">
        {PROGRAM.map((day) => {
          const first = day.slots[0];
          const exerciseId = store.variantChoice[first.slotId] ?? first.variants[0];
          const last = lastPerformance(store.sessions, exerciseId);
          const load = last ? topWeight(last.entry) : null;
          return (
            <button key={day.id} type="button" className="planlist__row" onClick={() => start(day.id)}>
              <span className="planlist__day">{day.short}</span>
              <span className="planlist__main">
                <span className="planlist__focus">{day.focus}</span>
                <span className="planlist__meta">
                  {plural(day.slots.length, 'exercise')} &middot;{' '}
                  {plural(
                    day.slots.reduce((n, s) => n + s.sets, 0),
                    'set',
                  )}
                  {load ? ` · ${getExercise(exerciseId).name} at ${num(load)} ${store.settings.unit}` : ''}
                </span>
              </span>
              <Icon name="chevron" size={15} className="planlist__chev" />
            </button>
          );
        })}
      </div>

      {store.sessions.length ? null : (
        <p className="tiny dim" style={{ marginTop: 20 }}>
          Nothing logged in strength mode yet. Your loads carry over between sessions once you start.
        </p>
      )}
    </div>
  );
}
