import { Icon } from '../components/Icon';
import { getCircuitExercise } from '../data/circuitExercises';
import { nextWorkoutAfter, workoutOn } from '../data/circuitProgram';
import {
  PROTEIN_TARGET_G,
  fastState,
  fastingRatio,
  formatFast,
  isMealLogged,
  mealsOn,
  proteinOn,
} from '../domain/nutrition';
import { consistency } from '../domain/circuitProgress';
import { WEEKDAY_LONG, formatShort, today as todayISO, weekdayOf } from '../lib/date';
import { plural } from '../lib/format';
import { useCircuitStore } from '../store/useCircuitStore';
import { useTick } from '../store/useTimer';

/** Rough, clearly-labelled estimate — never the point, just context. */
function estimateKcal(minutes: number): number {
  return Math.round(minutes * 6.2);
}

export function Today({
  onStart,
  onViewMeals,
  onViewWorkout,
}: {
  onStart: (sessionId: string) => void;
  onViewMeals: () => void;
  onViewWorkout: (workoutId: string) => void;
}) {
  const circuit = useCircuitStore();
  const now = todayISO();
  const weekday = weekdayOf(now);
  const workout = workoutOn(circuit.plan, weekday);
  const next = nextWorkoutAfter(circuit.plan, weekday);

  // Keeps the fasting clock honest without a second-by-second re-render.
  const tick = useTick(true);
  const clockNow = new Date(tick);

  const todaysSessions = circuit.sessions.filter(
    (s) => s.date === now && s.workoutId === workout?.id,
  );
  const activeSession = todaysSessions.find((s) => !s.finishedAt);
  const doneSession = todaysSessions.find((s) => s.finishedAt);

  const fast = fastState(circuit, now, clockNow);
  const protein = proteinOn(circuit, now);
  const meals = mealsOn(now);
  const streak = consistency(circuit, now);

  const start = () => {
    if (!workout) return;
    onStart(circuit.resumeOrStart(workout.id, now));
  };

  const insight =
    streak.total === 0
      ? 'First session of the block is the one that counts.'
      : `${plural(streak.total, 'workout')} in the last ${streak.weeks} weeks.`;

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">
            {WEEKDAY_LONG[weekday]} {formatShort(now)}
          </div>
          <h1>Today</h1>
        </div>
      </header>

      {workout && !doneSession ? (
        <>
          <div className="trainingcard__focus">{workout.focus}</div>
          <div className="trainingcard__mode">
            {workout.mode === 'strength' ? 'Strength — sets' : 'Functional circuit'}
          </div>

          <div className="trainingcard__stats">
            <span className="num">{workout.minutes} min</span>
            <span className="num">~{estimateKcal(workout.minutes)} kcal</span>
            <span className="num">{plural(workout.exerciseIds.length, 'exercise')}</span>
            <span className="num">{plural(workout.rounds, 'round')}</span>
          </div>

          <button type="button" className="btn btn--primary btn--block trainingcard__cta" onClick={start}>
            {activeSession ? 'Resume workout' : 'Start workout'}
            <Icon name="chevron" size={17} />
          </button>
          {activeSession ? (
            <p className="tiny dim" style={{ marginTop: 10, textAlign: 'center' }}>
              {Object.keys(activeSession.completed).length} checked off
            </p>
          ) : null}

          <div className="exlist">
            <div className="label" style={{ marginBottom: 10 }}>
              Today&rsquo;s workout
            </div>
            {workout.exerciseIds.map((id, i) => {
              const ex = getCircuitExercise(id);
              return (
                <div key={`${id}-${i}`} className="exlist__row">
                  <span className="exlist__n num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="exlist__name">{ex.name}</span>
                  <span className="exlist__plan num">
                    {ex.line} &times; {workout.rounds}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : workout && doneSession ? (
        <>
          <div className="trainingcard__focus">{workout.focus}</div>
          <div className="trainingcard__mode">Complete</div>
          <p className="small muted" style={{ marginTop: 12 }}>
            {plural(workout.exerciseIds.length, 'exercise')} &middot;{' '}
            {plural(workout.rounds, 'round')} done. Nice work.
          </p>
        </>
      ) : (
        <>
          <div className="trainingcard__focus">Rest day</div>
          <div className="trainingcard__mode">Recover</div>
          <p className="small muted" style={{ marginTop: 12, maxWidth: '34ch' }}>
            No workout scheduled. Protein, water, a walk, and sleep — that is where the work gets
            paid out.
          </p>

          {next ? (
            <>
              <div className="label" style={{ marginTop: 28, marginBottom: 10 }}>
                Next
              </div>
              <div className="row-between" style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div className="mid">{next.focus}</div>
                  <div className="tiny dim" style={{ marginTop: 3 }}>
                    {WEEKDAY_LONG[next.weekday]} &middot;{' '}
                    {next.mode === 'strength' ? 'strength' : 'functional circuit'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onViewWorkout(next.id)}
                >
                  View
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ── Fasting ─────────────────────────────────────────────────────── */}
      <div className="fastcard">
        <div style={{ flex: 1 }}>
          <div className="label">Fasting</div>
          <div className="fastcard__clock num">
            {fast.complete ? 'Fast complete' : formatFast(fast.elapsedMs)}
          </div>
          <div className="tiny dim num" style={{ marginTop: 2 }}>
            {fastingRatio(circuit)} &middot; eating opens {fast.eatFrom}
          </div>
        </div>
        {!fast.complete ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => circuit.breakFast(now)}>
            End fast
          </button>
        ) : (
          <Icon name="check" size={20} className="fastcard__done" />
        )}
      </div>

      {/* ── Fuel ────────────────────────────────────────────────────────── */}
      <div className="label" style={{ marginTop: 30, marginBottom: 12 }}>
        {workout ? 'Fuel' : "Today's fuel · recovery day"}
      </div>
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <span style={{ fontSize: 15 }}>Protein</span>
        <span className="num" style={{ fontSize: 15, color: 'var(--text-2)' }}>
          {protein} / {PROTEIN_TARGET_G} g
        </span>
      </div>
      <div className="meter">
        <div
          className="meter__fill"
          style={{ width: `${Math.min(100, (protein / PROTEIN_TARGET_G) * 100)}%` }}
        />
      </div>

      <div className="meallist">
        {meals.map((m) => {
          const logged = isMealLogged(circuit, now, m.id);
          return (
            <button
              key={m.id}
              type="button"
              className="meallist__row"
              onClick={() => circuit.toggleMeal(now, m.id)}
              aria-pressed={logged}
            >
              <span className="meallist__time num">{m.time}</span>
              <span className={`meallist__name ${logged ? 'meallist__name--done' : ''}`}>{m.name}</span>
              <span className={`meallist__tick ${logged ? 'meallist__tick--on' : ''}`}>
                <Icon name="check" size={14} />
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" className="btn btn--ghost btn--block" style={{ marginTop: 16 }} onClick={onViewMeals}>
        View meals
        <Icon name="chevron" size={15} />
      </button>

      {!workout ? (
        <div className="tiny dim" style={{ marginTop: 10 }}>
          Slightly lower carbohydrate than a training day.
        </div>
      ) : null}

      {/* ── One insight, not a dashboard ────────────────────────────────── */}
      <p className="today__insight">{insight}</p>
    </div>
  );
}
