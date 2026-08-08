import { useMemo, useState } from 'react';
import { ExerciseBlock } from '../components/ExerciseBlock';
import { Icon } from '../components/Icon';
import { ReadinessSheet } from '../components/ReadinessSheet';
import { useWakeLock } from '../hooks/useWakeLock';
import { Sheet } from '../components/Sheet';
import { getExercise } from '../data/exercises';
import { DAY_BY_ID } from '../data/program';
import { completedSets, sessionVolume } from '../domain/progression';
import { duration, volume as fmtVolume } from '../lib/format';
import { bodyweightOn, useStore } from '../store/useStore';
import { useTick } from '../store/useTimer';

export function SessionView({
  sessionId,
  onFinished,
  onExit,
}: {
  sessionId: string;
  onFinished: (id: string) => void;
  onExit: () => void;
}) {
  const store = useStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  const [index, setIndex] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [askReadiness, setAskReadiness] = useState(
    () => store.settings.askReadiness && !session?.readiness,
  );
  const now = useTick(true);
  // The screen must not sleep between sets.
  useWakeLock(true);

  const day = session ? DAY_BY_ID[session.dayId] : null;
  const bodyweight = useMemo(
    () => (session ? bodyweightOn(store, session.date) : 0),
    [store, session],
  );

  if (!session || !day) return null;

  const entry = session.entries[index];
  const slot = day.slots.find((s) => s.slotId === entry.slotId);
  const totalPlanned = session.entries.reduce((n, e) => n + e.targetSets, 0);
  const totalDone = session.entries.reduce((n, e) => n + completedSets(e).length, 0);
  const doneExercises = session.entries.filter((e) => completedSets(e).length > 0).length;
  const isLast = index === session.entries.length - 1;
  const anythingLogged = totalDone > 0;

  const finish = () => {
    store.finishSession(session.id);
    onFinished(session.id);
  };

  return (
    <div className="session">
      <header className="session__head">
        <div className="session__headinner">
          <div className="row-between">
            <button
              type="button"
              className="btn btn--quiet"
              style={{ marginLeft: -12 }}
              onClick={() => (anythingLogged ? setConfirmExit(true) : onExit())}
            >
              <Icon name="back" size={18} />
              Pause
            </button>
            <div className="tiny dim num" style={{ display: 'flex', gap: 12 }}>
              <span>{duration(now - session.startedAt)}</span>
              <span>
                {fmtVolume(sessionVolume(session, bodyweight))} {store.settings.unit}
              </span>
            </div>
          </div>
          <div className="row-between" style={{ marginTop: 2 }}>
            <div>
              <div className="mid">
                {day.name} <span className="dim" style={{ fontWeight: 500 }}>· {day.focus}</span>
              </div>
            </div>
            <span className="pill">
              {totalDone}/{totalPlanned} sets
            </span>
          </div>
          <div className="progressline">
            <div
              className="progressline__fill"
              style={{ width: `${totalPlanned ? (totalDone / totalPlanned) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      <div className="session__stage">
        <nav className="exnav" aria-label="Exercises">
          {session.entries.map((e, i) => {
            const done = completedSets(e).length >= e.targetSets;
            return (
              <button
                key={e.slotId}
                type="button"
                className={`exnav__item ${i === index ? 'exnav__item--on' : done ? 'exnav__item--done' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Exercise ${i + 1}: ${getExercise(e.exerciseId).name}`}
                aria-current={i === index}
              >
                <span className="exnav__num num">{i + 1}</span>
                <span className="exnav__name">{getExercise(e.exerciseId).name}</span>
              </button>
            );
          })}
        </nav>

        <div className="session__body" key={entry.slotId}>
          {slot ? (
            <ExerciseBlock
              session={session}
              entry={entry}
              slot={slot}
              isLastExercise={isLast}
              onNext={() => (isLast ? setConfirmFinish(true) : setIndex((i) => i + 1))}
            />
          ) : null}
        </div>
      </div>

      <ReadinessSheet
        open={askReadiness}
        onSkip={() => setAskReadiness(false)}
        onSubmit={(r) => {
          store.setReadiness(session.id, r);
          setAskReadiness(false);
        }}
      />

      <Sheet open={confirmExit} onClose={() => setConfirmExit(false)} title="Stop here?">
        <p className="muted small" style={{ marginBottom: 20 }}>
          {totalDone} sets logged. Pausing keeps the session open to pick back up; finishing files
          it and works out your records.
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => setConfirmExit(false)}
          >
            Keep training
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onExit}>
            Pause and save
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              setConfirmExit(false);
              setConfirmFinish(true);
            }}
          >
            Finish workout now
          </button>
        </div>
      </Sheet>

      <Sheet open={confirmFinish} onClose={() => setConfirmFinish(false)} title="Finish workout?">
        <p className="muted small" style={{ marginBottom: 20 }}>
          {doneExercises} of {session.entries.length} exercises logged, {totalDone} sets in.
          {doneExercises < session.entries.length
            ? ' Anything you skipped simply is not recorded — no penalty.'
            : ' Full session. Nice work.'}
        </p>
        <div className="stack">
          <button type="button" className="btn btn--primary btn--block" onClick={finish}>
            Finish and save
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--block"
            onClick={() => setConfirmFinish(false)}
          >
            Not yet
          </button>
        </div>
      </Sheet>
    </div>
  );
}
