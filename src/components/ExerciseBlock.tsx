import { useEffect, useMemo, useState } from 'react';
import { getExercise } from '../data/exercises';
import { phaseForWeek } from '../data/program';
import { clock, num } from '../lib/format';
import { primeAudio } from '../lib/notify';
import {
  completedSets,
  lastPerformance,
  loadDecision,
  progressionMessage,
  type LoadOption,
} from '../domain/progression';
import { restForExercise, useStore } from '../store/useStore';
import { useTick, useTimer } from '../store/useTimer';
import type { ExerciseEntry, ProgramSlot, Session } from '../types';
import { Icon } from './Icon';
import { LoadChoice } from './LoadChoice';
import { LogZone, type ZoneState } from './LogZone';
import { Numpad } from './Numpad';
import { SetChips } from './SetChips';
import { Sheet } from './Sheet';

export function ExerciseBlock({
  session,
  entry,
  slot,
  isLastExercise,
  onNext,
}: {
  session: Session;
  entry: ExerciseEntry;
  slot: ProgramSlot;
  isLastExercise: boolean;
  onNext: () => void;
}) {
  const store = useStore();
  const { settings, sessions } = store;
  const unit = settings.unit;
  const timer = useTimer();
  const [numpadOpen, setNumpadOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const exercise = getExercise(entry.exerciseId);
  const logged = completedSets(entry);
  const allDone = logged.length >= entry.targetSets;

  const last = useMemo(
    () => lastPerformance(sessions, entry.exerciseId, session.id),
    [sessions, entry.exerciseId, session.id],
  );
  const lastSets = last ? completedSets(last.entry) : [];

  const [chosen, setChosen] = useState<LoadOption['id'] | null>(null);
  const decision = useMemo(
    () => loadDecision(entry, last, session.readiness, unit),
    [entry, last, session.readiness, unit],
  );

  const phase = phaseForWeek(session.week);
  const rirTarget = phase.deload
    ? phase.rirLabel
    : exercise.kind === 'compound'
      ? 'RIR 1–3'
      : 'RIR 1–2';

  const restSec = restForExercise(settings, entry.exerciseId, slot.restSec);

  // The first unlogged set is what the zone is offering.
  const activeIndex = entry.sets.findIndex((s) => s.reps === 0);
  const active = activeIndex >= 0 ? entry.sets[activeIndex] : null;
  const lastLoggedIndex = entry.sets.reduce((acc, s, i) => (s.reps > 0 ? i : acc), -1);

  // Reps default to what was done at this set number last time.
  const suggestedReps = lastSets[activeIndex]?.reps ?? entry.repMin;
  const [reps, setReps] = useState(suggestedReps);
  useEffect(() => {
    setReps(suggestedReps);
  }, [suggestedReps, activeIndex]);

  const now = useTick(timer.endsAt !== null);
  const remaining = timer.endsAt ? (timer.endsAt - now) / 1000 : 0;
  const restDone = timer.endsAt !== null && remaining <= 0;
  const state: ZoneState = timer.endsAt !== null ? 'rest' : allDone ? 'done' : 'log';

  const weight = active?.weight ?? entry.sets[entry.sets.length - 1]?.weight ?? 0;

  const setWeight = (w: number) => {
    const next = Math.max(0, Math.round(w * 100) / 100);
    if (activeIndex >= 0) store.setEntryWeight(session.id, entry.slotId, next);
  };

  const handleLog = () => {
    if (activeIndex < 0 || reps <= 0) return;
    primeAudio();
    store.logSet(session.id, entry.slotId, activeIndex, weight, reps);
    const remainingSets = entry.sets.filter((s, i) => i !== activeIndex && s.reps === 0).length;
    if (settings.autoStartRest && remainingSets > 0) {
      timer.start(restSec, `${exercise.name} · set ${activeIndex + 2} next`);
    }
  };

  const handleUndo = () => {
    if (lastLoggedIndex < 0) return;
    store.clearSet(session.id, entry.slotId, lastLoggedIndex);
    timer.stop();
  };

  const message = allDone ? progressionMessage(entry, last?.entry ?? null, false, unit) : null;

  // While resting, the zone previews the set that is coming next.
  const previewIndex = activeIndex >= 0 ? activeIndex : entry.sets.length - 1;

  return (
    <div className="exercise">
      <div className="exercise__head">
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

        <div className="exercise__meta num">
          {last ? (
            <>
              <strong>Last</strong> {num(Math.max(...lastSets.map((s) => s.weight)))} {unit} ·{' '}
              {lastSets.map((s) => s.reps).join('/')}
            </>
          ) : (
            <span className="dim">No history — this sets the baseline.</span>
          )}
          <span className="dim"> · {rirTarget}</span>
          <span className="dim"> · {clock(restSec)} rest</span>
        </div>

        {slot.variants.length > 1 ? (
          <div className="chiprow" style={{ marginTop: 10 }}>
            {slot.variants.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${id === entry.exerciseId ? 'chip--alt' : ''}`}
                onClick={() => store.chooseVariant(slot.slotId, id)}
                disabled={logged.length > 0 && id !== entry.exerciseId}
              >
                {getExercise(id).name}
              </button>
            ))}
          </div>
        ) : null}

        {/* Only before the first set — once you have lifted, it is decided. */}
        {decision && logged.length === 0 ? (
          <LoadChoice
            decision={decision}
            unit={unit}
            selected={chosen}
            onChoose={(o) => {
              setChosen(o.id);
              setWeight(o.weight);
            }}
            onSetStart={() => setNumpadOpen(true)}
          />
        ) : null}

        <SetChips sets={entry.sets} activeIndex={activeIndex} onSelect={setEditIndex} />

        <div className="exercise__tools">
          {/* An extra set only makes sense once the prescribed ones are done. */}
          {allDone ? (
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => store.addSetRow(session.id, entry.slotId)}
            >
              <Icon name="plus" size={15} /> I did another
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => setNotesOpen((v) => !v)}
          >
            <Icon name="note" size={15} /> {entry.notes ? 'Note ✓' : 'Note'}
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
      </div>

      <LogZone
        state={state}
        setNumber={previewIndex + 1}
        totalSets={entry.sets.length}
        weight={weight}
        reps={reps}
        unit={unit}
        unitSuffix={
          exercise.inverseLoad ? `${unit} assist` : exercise.usesBodyweight ? `${unit} added` : unit
        }
        restRemaining={remaining}
        restDuration={timer.duration}
        restDone={restDone}
        lastRir={lastLoggedIndex >= 0 ? entry.sets[lastLoggedIndex].rir : null}
        progressionText={message?.text ?? null}
        isLastExercise={isLastExercise}
        onLog={handleLog}
        onAdjustReps={(d) => setReps((r) => Math.max(0, r + d))}
        onAdjustWeight={(steps) => setWeight(weight + steps * exercise.step)}
        onEditWeight={() => setNumpadOpen(true)}
        onSkipRest={timer.stop}
        onExtendRest={timer.extend}
        onUndo={handleUndo}
        onRir={(rir) => {
          if (lastLoggedIndex >= 0) store.setRir(session.id, entry.slotId, lastLoggedIndex, rir);
        }}
        onNext={onNext}
      />

      <Numpad
        open={numpadOpen}
        value={weight}
        unit={unit}
        step={exercise.step}
        onClose={() => setNumpadOpen(false)}
        onCommit={setWeight}
      />

      <EditSet
        index={editIndex}
        entry={entry}
        unit={unit}
        step={exercise.step}
        onClose={() => setEditIndex(null)}
        onChange={(i, w, r) => store.logSet(session.id, entry.slotId, i, w, r)}
        onClear={(i) => {
          store.clearSet(session.id, entry.slotId, i);
          setEditIndex(null);
        }}
      />
    </div>
  );
}

/** Correcting an already-logged set — rare, so it lives behind a tap. */
function EditSet({
  index,
  entry,
  unit,
  step,
  onClose,
  onChange,
  onClear,
}: {
  index: number | null;
  entry: ExerciseEntry;
  unit: string;
  step: number;
  onClose: () => void;
  onChange: (index: number, weight: number, reps: number) => void;
  onClear: (index: number) => void;
}) {
  const set = index !== null ? entry.sets[index] : null;
  if (index === null || !set || set.reps === 0) return null;

  return (
    <Sheet open onClose={onClose} title={`Set ${index + 1}`}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="dialrow">
          <button
            type="button"
            className="dial__btn"
            aria-label="Decrease weight"
            onClick={() => onChange(index, Math.max(0, set.weight - step), set.reps)}
          >
            <Icon name="minus" size={20} />
          </button>
          <div className="dial__value dial__value--static">
            <span className="num display">{num(set.weight)}</span>
            <span className="dial__unit">{unit}</span>
          </div>
          <button
            type="button"
            className="dial__btn"
            aria-label="Increase weight"
            onClick={() => onChange(index, set.weight + step, set.reps)}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>

        <div className="dialrow">
          <button
            type="button"
            className="dial__btn"
            aria-label="One rep fewer"
            onClick={() => onChange(index, set.weight, Math.max(1, set.reps - 1))}
          >
            <Icon name="minus" size={20} />
          </button>
          <div className="dial__value dial__value--static">
            <span className="num display">{set.reps}</span>
            <span className="dial__unit">reps</span>
          </div>
          <button
            type="button"
            className="dial__btn"
            aria-label="One rep more"
            onClick={() => onChange(index, set.weight, set.reps + 1)}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>

        <button type="button" className="btn btn--danger btn--block" onClick={() => onClear(index)}>
          Delete this set
        </button>
        <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
          Done
        </button>
      </div>
    </Sheet>
  );
}
