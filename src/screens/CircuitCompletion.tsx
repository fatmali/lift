import { Icon } from '../components/Icon';
import { Stat } from '../components/Primitives';
import { getCircuitExercise } from '../data/circuitExercises';
import { nextWorkoutAfter } from '../data/circuitProgram';
import { WEEKDAY_LONG, fromISODate } from '../lib/date';
import { plural } from '../lib/format';
import { useCircuitStore } from '../store/useCircuitStore';

function estimateKcal(minutes: number): number {
  return Math.round(minutes * 6.2);
}

export function CircuitCompletion({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const circuit = useCircuitStore();
  const session = circuit.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const workout = circuit.plan.find((d) => d.id === session.workoutId);
  const weekday = fromISODate(session.date).getDay();
  const next = nextWorkoutAfter(circuit.plan, weekday);
  const minutes = Math.max(
    1,
    Math.round(((session.finishedAt ?? Date.now()) - session.startedAt) / 60_000),
  );
  // Read the movements off the session itself, so a plan edited after the
  // fact cannot rewrite what this workout actually was.
  const exerciseIds = workout?.exerciseIds ?? Object.keys(session.loadsUsed ?? {});
  const rounds = Array.from({ length: session.rounds }, (_, i) => i + 1);
  const roundsDone = rounds.filter((r) =>
    exerciseIds.every((id) => session.completed[`${r}-${id}`]),
  ).length;

  return (
    <div className="circuitdone">
      <div className="circuitdone__inner">
        <div className="circuitdone__check">
          <Icon name="check" size={24} />
        </div>
        <h1 className="circuitdone__title">{session.focus}</h1>
        <div className="circuitdone__sub">complete</div>
        <div className="tiny dim" style={{ marginTop: 10 }}>
          {WEEKDAY_LONG[weekday]}
        </div>

        <div className="statgrid" style={{ marginTop: 26 }}>
          <Stat value={minutes} label="min" />
          <Stat value={`~${estimateKcal(minutes)}`} label="kcal est." />
          <Stat value={exerciseIds.length} label="exercises" />
        </div>

        <div className="label" style={{ marginTop: 30, marginBottom: 4 }}>
          Session breakdown
        </div>
        <div className="circuitdone__list">
          {exerciseIds.map((id) => {
            const ex = getCircuitExercise(id);
            const done = rounds.filter((r) => session.completed[`${r}-${id}`]).length;
            return (
              <div key={id} className="circuitdone__row">
                <span className="circuitdone__rowname">{ex.name}</span>
                <span className="tiny dim num">
                  {done}/{session.rounds} rounds
                </span>
              </div>
            );
          })}
        </div>

        <p className="small muted" style={{ marginTop: 24 }}>
          {plural(roundsDone, 'round')} through {plural(exerciseIds.length, 'exercise')}.
          {next ? (
            <>
              {' '}
              Next is <span style={{ color: 'var(--text)' }}>{next.focus}</span> on{' '}
              {WEEKDAY_LONG[next.weekday]}.
            </>
          ) : null}
        </p>

        <button type="button" className="btn btn--primary btn--block" style={{ marginTop: 28 }} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
