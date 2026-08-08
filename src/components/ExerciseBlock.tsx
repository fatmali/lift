import { useMemo, useState } from 'react';
import { getExercise } from '../data/exercises';
import { phaseForWeek } from '../data/program';
import { formatRelativeDay } from '../lib/date';
import { clock, num } from '../lib/format';
import { primeAudio } from '../lib/notify';
import {
  completedSets,
  lastPerformance,
  progressionMessage,
  readyToProgress,
} from '../domain/progression';
import { restForExercise, useStore } from '../store/useStore';
import { useTimer } from '../store/useTimer';
import type { ExerciseEntry, ProgramSlot, Session } from '../types';
import { Icon } from './Icon';
import { NumField } from './NumField';
import { Notice } from './Primitives';
import { SetRow } from './SetRow';

export function ExerciseBlock({
  session,
  entry,
  slot,
}: {
  session: Session;
  entry: ExerciseEntry;
  slot: ProgramSlot;
}) {
  const store = useStore();
  const { settings, sessions } = store;
  const unit = settings.unit;
  const startRest = useTimer((s) => s.start);
  const [rirOpen, setRirOpen] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const exercise = getExercise(entry.exerciseId);
  const logged = completedSets(entry);
  const allDone = logged.length >= entry.targetSets;

  const last = useMemo(
    () => lastPerformance(sessions, entry.exerciseId, session.id),
    [sessions, entry.exerciseId, session.id],
  );

  const lastSets = last ? completedSets(last.entry) : [];
  const readySignal = last ? readyToProgress(last.entry, last.session.date) : null;

  const phase = phaseForWeek(session.week);
  const rirTarget = phase.deload
    ? phase.rirLabel
    : exercise.kind === 'compound'
      ? 'RIR 1–3'
      : 'RIR 1–2';

  const restSec = restForExercise(settings, entry.exerciseId, slot.restSec);
  const workingWeight = entry.sets.find((s) => s.reps === 0)?.weight ?? entry.sets[0]?.weight ?? 0;

  const message = allDone
    ? progressionMessage(entry, last?.entry ?? null, false, unit)
    : null;

  const handleLog = (index: number, weight: number, reps: number) => {
    primeAudio();
    store.logSet(session.id, entry.slotId, index, weight, reps);
    setRirOpen(index);
    const remaining = entry.sets.filter((s, i) => i !== index && s.reps === 0).length;
    if (settings.autoStartRest && remaining > 0) {
      startRest(restSec, `${exercise.name} · set ${index + 2} next`);
    }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="ex__name">{exercise.name}</h2>
            <p className="ex__cue">{exercise.cue}</p>
          </div>
          <span className="pill" style={{ flex: 'none' }}>
            {entry.targetSets} × {entry.repMin}
            {entry.repMax !== entry.repMin ? `–${entry.repMax}` : ''}
            {exercise.unilateral ? ' /side' : ''}
          </span>
        </div>

        <div className="chiprow" style={{ marginTop: 12 }}>
          <span className="chip chip--tone">{rirTarget}</span>
          <span className="chip chip--tone">
            <Icon name="timer" size={13} /> {clock(restSec)} rest
          </span>
          {slot.variants.length > 1
            ? slot.variants.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`chip ${id === entry.exerciseId ? 'chip--alt' : ''}`}
                  onClick={() => store.chooseVariant(slot.slotId, id)}
                  disabled={logged.length > 0 && id !== entry.exerciseId}
                >
                  {getExercise(id).name}
                </button>
              ))
            : null}
        </div>
      </div>

      <div className="lasttime">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lasttime__label">Last session</div>
          <div className="lasttime__value num">
            {last ? (
              <>
                {num(Math.max(...lastSets.map((s) => s.weight)))} {unit} ·{' '}
                {lastSets.map((s) => s.reps).join(' / ')}
              </>
            ) : (
              <span className="dim" style={{ fontSize: 14 }}>
                No history yet — this one sets the baseline.
              </span>
            )}
          </div>
        </div>
        {last ? <span className="pill">{formatRelativeDay(last.session.date)}</span> : null}
      </div>

      {readySignal && !allDone && workingWeight === readySignal.weight ? (
        <Notice tone="data" icon="⬆️">
          You hit the top of the rep range last session ({readySignal.sets} × {readySignal.repMax} @{' '}
          {num(readySignal.weight)} {unit}). Consider {num(readySignal.suggested)} {unit} today —
          your call.
        </Notice>
      ) : null}

      <div>
        <div className="label" style={{ marginBottom: 8 }}>
          Working weight
        </div>
        <div className="weightctl">
          <button
            type="button"
            className="weightctl__btn"
            aria-label={`Decrease weight by ${exercise.step}`}
            onClick={() =>
              store.setEntryWeight(
                session.id,
                entry.slotId,
                Math.max(0, Math.round((workingWeight - exercise.step) * 100) / 100),
              )
            }
          >
            <Icon name="minus" size={18} />
          </button>
          <div className="weightctl__field">
            <NumField
              className="weightctl__input num"
              value={workingWeight}
              ariaLabel="Working weight"
              onChange={(w) => store.setEntryWeight(session.id, entry.slotId, w)}
            />
            <span className="weightctl__unit">
              {exercise.inverseLoad ? `${unit} assist` : exercise.usesBodyweight ? `${unit} added` : unit}
            </span>
          </div>
          <button
            type="button"
            className="weightctl__btn"
            aria-label={`Increase weight by ${exercise.step}`}
            onClick={() =>
              store.setEntryWeight(
                session.id,
                entry.slotId,
                Math.round((workingWeight + exercise.step) * 100) / 100,
              )
            }
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <ul>
        {entry.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i}
            set={set}
            ghostReps={lastSets[i]?.reps ?? entry.repMin}
            rirOpen={rirOpen === i}
            onToggleRir={() => setRirOpen(rirOpen === i ? null : i)}
            onLog={(w, r) => handleLog(i, w, r)}
            onClear={() => {
              store.clearSet(session.id, entry.slotId, i);
              setRirOpen(null);
            }}
            onWeight={(w) => store.setSetWeight(session.id, entry.slotId, i, w)}
            onRir={(rir) => {
              store.setRir(session.id, entry.slotId, i, rir);
              setRirOpen(null);
            }}
          />
        ))}
      </ul>

      <div className="row-between">
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => store.addSetRow(session.id, entry.slotId)}
          >
            <Icon name="plus" size={15} /> Set
          </button>
          {entry.sets.length > entry.targetSets &&
          entry.sets[entry.sets.length - 1].reps === 0 ? (
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => store.removeSetRow(session.id, entry.slotId)}
            >
              Remove
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => setNotesOpen((v) => !v)}
        >
          <Icon name="note" size={15} /> {entry.notes ? 'Edit note' : 'Note'}
        </button>
      </div>

      {notesOpen || entry.notes ? (
        <textarea
          className="input"
          rows={2}
          placeholder="Setup, pin position, how it felt…"
          value={entry.notes ?? ''}
          onChange={(e) => store.setEntryNotes(session.id, entry.slotId, e.target.value)}
        />
      ) : null}

      {message ? (
        <Notice tone={message.tone === 'up' || message.tone === 'pr' ? 'pr' : 'default'}>
          {message.text}
        </Notice>
      ) : null}
    </div>
  );
}
