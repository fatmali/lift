import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { CIRCUIT_EXERCISES, getCircuitExercise } from '../data/circuitExercises';
import { WEEKDAY_LONG, WEEKDAY_SHORT } from '../lib/date';
import { useCircuitStore } from '../store/useCircuitStore';

const LIBRARY = Object.values(CIRCUIT_EXERCISES);

export function PlanEditor({ workoutId, onDone }: { workoutId: string; onDone: () => void }) {
  const circuit = useCircuitStore();
  const workout = circuit.plan.find((d) => d.id === workoutId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!workout) return null;

  const taken = new Set(
    circuit.plan.filter((d) => d.id !== workout.id).map((d) => d.weekday),
  );
  const addable = LIBRARY.filter((e) => !workout.exerciseIds.includes(e.id));

  const patch = (p: Parameters<typeof circuit.updateWorkout>[1]) =>
    circuit.updateWorkout(workout.id, p);

  return (
    <div className="screen">
      <div className="row-between">
        <button type="button" className="circuit__back" onClick={onDone}>
          <Icon name="back" size={15} /> Plan
        </button>
        <button type="button" className="editor__done" onClick={onDone}>
          Done
        </button>
      </div>

      <div className="label" style={{ marginTop: 30, marginBottom: 8 }}>
        Muscle focus
      </div>
      <input
        className="editor__focus"
        value={workout.focus}
        placeholder="Glutes + Quads"
        aria-label="Muscle focus"
        onChange={(e) => patch({ focus: e.target.value })}
      />
      <div className="tiny dim" style={{ marginTop: 8 }}>
        This is the headline you see on Today.
      </div>

      <div className="label" style={{ marginTop: 30, marginBottom: 10 }}>
        Day
      </div>
      <div className="daypicker">
        {WEEKDAY_SHORT.map((label, i) => {
          const on = workout.weekday === i;
          const busy = taken.has(i);
          return (
            <button
              key={label}
              type="button"
              className={`daypicker__day ${on ? 'daypicker__day--on' : ''}`}
              disabled={busy}
              title={busy ? 'Another workout is on this day' : undefined}
              onClick={() => patch({ weekday: i })}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="tiny dim" style={{ marginTop: 10 }}>
        {WEEKDAY_LONG[workout.weekday]}
        {taken.size ? ' · days already taken are greyed out' : ''}
      </div>

      <div className="label" style={{ marginTop: 30, marginBottom: 10 }}>
        Style
      </div>
      <div className="modepick">
        <button
          type="button"
          className={`modepick__opt ${workout.mode === 'functional' ? 'modepick__opt--on' : ''}`}
          onClick={() => patch({ mode: 'functional' })}
        >
          Functional
          <span className="tiny dim">rounds</span>
        </button>
        <button
          type="button"
          className={`modepick__opt ${workout.mode === 'strength' ? 'modepick__opt--on' : ''}`}
          onClick={() => patch({ mode: 'strength' })}
        >
          Strength
          <span className="tiny dim">sets</span>
        </button>
      </div>

      <div className="steppers">
        <div className="steppers__col">
          <div className="label" style={{ marginBottom: 10 }}>
            Rounds
          </div>
          <div className="stepper">
            <button
              type="button"
              aria-label="Fewer rounds"
              className="stepper__btn"
              onClick={() => patch({ rounds: Math.max(1, workout.rounds - 1) })}
            >
              <Icon name="minus" size={18} />
            </button>
            <span className="num stepper__val">{workout.rounds}</span>
            <button
              type="button"
              aria-label="More rounds"
              className="stepper__btn"
              onClick={() => patch({ rounds: Math.min(6, workout.rounds + 1) })}
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        </div>
        <div className="steppers__col">
          <div className="label" style={{ marginBottom: 10 }}>
            Minutes
          </div>
          <div className="stepper">
            <button
              type="button"
              aria-label="Shorter"
              className="stepper__btn"
              onClick={() => patch({ minutes: Math.max(15, workout.minutes - 5) })}
            >
              <Icon name="minus" size={18} />
            </button>
            <span className="num stepper__val">{workout.minutes}</span>
            <button
              type="button"
              aria-label="Longer"
              className="stepper__btn"
              onClick={() => patch({ minutes: workout.minutes + 5 })}
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="label" style={{ marginTop: 32, marginBottom: 4 }}>
        Exercises
      </div>
      <div className="editor__exlist">
        {workout.exerciseIds.map((id, i) => {
          const ex = getCircuitExercise(id);
          return (
            <div key={`${id}-${i}`} className="editor__exrow">
              <span className="num exlist__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="editor__exname">{ex.name}</span>
              <span className="num tiny dim">{ex.line}</span>
              <button
                type="button"
                aria-label={`Remove ${ex.name}`}
                className="editor__remove"
                onClick={() =>
                  patch({ exerciseIds: workout.exerciseIds.filter((_, j) => j !== i) })
                }
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          );
        })}
        {!workout.exerciseIds.length ? (
          <p className="tiny dim" style={{ padding: '14px 0' }}>
            No exercises yet — add some from the library below.
          </p>
        ) : null}
      </div>

      <div className="label" style={{ marginTop: 26, marginBottom: 10 }}>
        Add from the library
      </div>
      <div className="chiprow">
        {addable.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="chip"
            onClick={() => patch({ exerciseIds: [...workout.exerciseIds, ex.id] })}
          >
            <Icon name="plus" size={13} />
            {ex.name}
          </button>
        ))}
        {!addable.length ? <span className="tiny dim">Every exercise is already in.</span> : null}
      </div>

      <button
        type="button"
        className="btn btn--danger btn--block"
        style={{ marginTop: 34 }}
        onClick={() => setConfirmDelete(true)}
      >
        Remove this workout
      </button>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Remove this workout?">
        <p className="muted small" style={{ marginBottom: 20 }}>
          {workout.focus} comes off your week. Sessions you have already finished stay in your
          history.
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => {
              circuit.deleteWorkout(workout.id);
              onDone();
            }}
          >
            Remove it
          </button>
          <button type="button" className="btn btn--quiet btn--block" onClick={() => setConfirmDelete(false)}>
            Keep it
          </button>
        </div>
      </Sheet>
    </div>
  );
}
