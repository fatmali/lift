import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { useWakeLock } from '../hooks/useWakeLock';
import { BANDS, getCircuitExercise } from '../data/circuitExercises';
import { clock, duration } from '../lib/format';
import { loadFor, useCircuitStore } from '../store/useCircuitStore';
import { useTick } from '../store/useTimer';

type Screen = 'preflight' | 'round' | 'exercise' | 'rest';

const REST_SECONDS = 60;

export function CircuitSession({
  sessionId,
  onFinished,
  onExit,
}: {
  sessionId: string;
  onFinished: (id: string) => void;
  onExit: () => void;
}) {
  const circuit = useCircuitStore();
  const session = circuit.sessions.find((s) => s.id === sessionId);
  const [screen, setScreen] = useState<Screen>('preflight');
  const [exIndex, setExIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [restLeft, setRestLeft] = useState(REST_SECONDS);
  const [restOn, setRestOn] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const now = useTick(screen !== 'preflight');
  useWakeLock(true);

  const workout = session ? circuit.plan.find((d) => d.id === session.workoutId) : undefined;
  const exerciseIds: string[] = workout?.exerciseIds ?? [];

  // Rest countdown.
  useEffect(() => {
    if (screen !== 'rest' || !restOn) return;
    const id = window.setInterval(() => {
      setRestLeft((t) => {
        if (t <= 1) {
          setRestOn(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [screen, restOn]);

  if (!session || !workout) return null;

  const round = session.currentRound;
  const key = (i: number) => `${round}-${exerciseIds[i]}`;
  const isChecked = (i: number) => !!session.completed[key(i)];
  const doneCount = exerciseIds.filter((_, i) => isChecked(i)).length;

  const finishRoundOrSession = () => {
    if (round >= session.rounds) {
      circuit.finishSession(session.id);
      onFinished(session.id);
      return;
    }
    setRestLeft(REST_SECONDS);
    setRestOn(true);
    setScreen('rest');
  };

  /** Applies a completion change, then checks whether the round just finished. */
  const applyAndCheckRound = (id: string, done: boolean) => {
    circuit.setExerciseComplete(session.id, round, id, done);
    if (!done) return;
    const fresh = useCircuitStore.getState().sessions.find((s) => s.id === session.id);
    const complete = fresh ? exerciseIds.every((_, idx) => !!fresh.completed[key(idx)]) : false;
    if (complete) finishRoundOrSession();
  };

  const toggle = (i: number) => {
    applyAndCheckRound(exerciseIds[i], !isChecked(i));
  };

  const openExercise = (i: number) => {
    setExIndex(i);
    setTimeLeft(null);
    setTimerOn(false);
    setScreen('exercise');
  };

  const cur = getCircuitExercise(exerciseIds[exIndex]);
  const curChecked = isChecked(exIndex);
  const isTimed = cur.kind === 'time';
  const effectiveTimeLeft = timeLeft === null ? (cur.seconds ?? 0) : timeLeft;

  const completeCurrent = () => {
    setScreen('round');
    setTimerOn(false);
    setTimeLeft(null);
    if (!curChecked) applyAndCheckRound(cur.id, true);
  };

  const startTimer = () => {
    setTimerOn(true);
    let t = effectiveTimeLeft;
    setTimeLeft(t);
    const id = window.setInterval(() => {
      t -= 1;
      if (t <= 0) {
        window.clearInterval(id);
        setTimerOn(false);
        setTimeLeft(0);
        setScreen('round');
        applyAndCheckRound(cur.id, true);
        return;
      }
      setTimeLeft(t);
    }, 1000);
  };

  const load = loadFor(circuit, cur.id);
  const weightLabel = load.kind === 'band' ? BANDS[load.bandIndex] : String(load.weight);

  const loadLabel = (id: string) => {
    const ex = getCircuitExercise(id);
    if (ex.kind === 'time') return '';
    const l = loadFor(circuit, id);
    return l.kind === 'band' ? ` · ${BANDS[l.bandIndex]} band` : ` · ${l.weight} kg`;
  };

  const anythingLogged = doneCount > 0 || round > 1;

  return (
    <div className="circuit">
      {screen === 'preflight' ? (
        <div className="circuit__pane circuit__preflight">
          <button type="button" className="circuit__back" onClick={onExit}>
            <Icon name="back" size={15} /> Today
          </button>
          <div className="label" style={{ marginTop: 44 }}>
            Today&rsquo;s session
          </div>
          <h2 className="circuit__title">{workout.focus}</h2>
          <div className="circuit__sub">Functional circuit</div>
          <div className="circuit__preflight-stats">
            <div>
              <div className="circuit__statval num">{workout.minutes}</div>
              <div className="circuit__statlabel">min</div>
            </div>
            <div>
              <div className="circuit__statval num">{exerciseIds.length}</div>
              <div className="circuit__statlabel">exercises</div>
            </div>
            <div>
              <div className="circuit__statval num">{workout.rounds}</div>
              <div className="circuit__statlabel">rounds</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn--primary btn--block circuit__cta"
            onClick={() => setScreen('round')}
          >
            Start
          </button>
          <div className="circuit__hint">Circuit — {workout.rounds} rounds through all {exerciseIds.length}.</div>
        </div>
      ) : null}

      {screen === 'round' ? (
        <div className="circuit__pane">
          <div className="row-between">
            <button
              type="button"
              className="circuit__back"
              onClick={() => (anythingLogged ? setConfirmExit(true) : onExit())}
            >
              <Icon name="back" size={15} /> Pause
            </button>
            <div className="tiny dim num">{duration(now - session.startedAt)}</div>
          </div>

          <div className="row-between" style={{ marginTop: 26, alignItems: 'baseline' }}>
            <h2 className="circuit__title" style={{ fontSize: 38 }}>
              Round {round}
            </h2>
            <span className="tiny dim num">of {session.rounds}</span>
          </div>
          <div className="circuit__roundbars">
            {Array.from({ length: session.rounds }, (_, i) => (
              <div key={i} className={`circuit__roundbar ${round > i ? 'circuit__roundbar--on' : ''}`} />
            ))}
          </div>
          <div className="tiny dim" style={{ marginTop: 12 }}>
            {doneCount} of {exerciseIds.length} done &middot; tap an exercise to change the weight
          </div>

          <div className="circuit__list">
            {exerciseIds.map((id, i) => {
              const ex = getCircuitExercise(id);
              const done = isChecked(i);
              return (
                <div key={id} className="circuit__row">
                  <button
                    type="button"
                    aria-label={done ? `Mark ${ex.name} not done` : `Complete ${ex.name}`}
                    className={`circuit__box ${done ? 'circuit__box--on' : ''}`}
                    onClick={() => toggle(i)}
                  >
                    <Icon name="check" size={22} />
                  </button>
                  <button type="button" className="circuit__rowmain" onClick={() => openExercise(i)}>
                    <div className={`circuit__rowname ${done ? 'circuit__rowname--done' : ''}`}>{ex.name}</div>
                    <div className="tiny dim num" style={{ marginTop: 2 }}>
                      {ex.line}
                      {loadLabel(id)}
                    </div>
                  </button>
                  <Icon name="chevron" size={14} className="circuit__chev" />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="circuit__end"
            onClick={() => {
              circuit.finishSession(session.id);
              onFinished(session.id);
            }}
          >
            End workout here
          </button>
        </div>
      ) : null}

      {screen === 'exercise' ? (
        <div className="circuit__pane">
          <div className="row-between">
            <button type="button" className="circuit__back" onClick={() => setScreen('round')}>
              <Icon name="back" size={15} /> Round {round}
            </button>
            <div className="tiny dim num">
              {exIndex + 1} / {exerciseIds.length}
            </div>
          </div>

          <h2 className="circuit__title" style={{ marginTop: 36 }}>
            {cur.name}
          </h2>
          <div className="circuit__prescription num">{cur.prescription}</div>

          {isTimed ? (
            <div className="circuit__clock">
              <div className={`circuit__clockval num ${effectiveTimeLeft === 0 ? 'circuit__clockval--done' : ''}`}>
                {clock(effectiveTimeLeft)}
              </div>
              <div className="circuit__clocklabel">
                {timerOn ? 'Counting down' : effectiveTimeLeft === 0 ? 'Time' : 'Ready'}
              </div>
            </div>
          ) : null}

          {!isTimed ? (
            <div className="circuit__stepper">
              <button
                type="button"
                aria-label={cur.kind === 'band' ? 'Lighter band' : 'Less weight'}
                className="circuit__stepbtn"
                onClick={() => circuit.adjustLoad(cur.id, -1)}
              >
                <Icon name="minus" size={22} />
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div className="circuit__stepval num">{weightLabel}</div>
                <div className="tiny dim" style={{ marginTop: 4 }}>
                  {cur.kind === 'band' ? 'band' : cur.unit}
                </div>
              </div>
              <button
                type="button"
                aria-label={cur.kind === 'band' ? 'Heavier band' : 'More weight'}
                className="circuit__stepbtn"
                onClick={() => circuit.adjustLoad(cur.id, 1)}
              >
                <Icon name="plus" size={22} />
              </button>
            </div>
          ) : null}

          {cur.suggestion ? (
            <div className="circuit__suggest">
              <Icon name="arrowUp" size={15} />
              <span>{cur.suggestion}</span>
            </div>
          ) : null}

          <p className="circuit__cue">{cur.cue}</p>

          <div style={{ flex: 1, minHeight: 26 }} />

          {isTimed && !timerOn && !curChecked && effectiveTimeLeft > 0 ? (
            <button type="button" className="btn btn--primary btn--block circuit__cta" onClick={startTimer}>
              <Icon name="timer" size={20} /> Start
            </button>
          ) : null}
          {isTimed && timerOn ? (
            <button
              type="button"
              className="btn btn--ghost btn--block circuit__cta"
              onClick={() => setTimerOn(false)}
            >
              Stop
            </button>
          ) : null}
          {!isTimed || curChecked || (!timerOn && effectiveTimeLeft === 0) ? (
            <button type="button" className="btn btn--primary btn--block circuit__cta" onClick={completeCurrent}>
              <Icon name="check" size={20} /> Done
            </button>
          ) : null}

          <button type="button" className="circuit__linkback" onClick={() => setScreen('round')}>
            Back to the round
          </button>
        </div>
      ) : null}

      {screen === 'rest' ? (
        <div className="circuit__pane circuit__rest">
          <div className="label" style={{ marginTop: 60 }}>
            Round {round} complete
          </div>
          <div className={`circuit__restclock num ${restLeft === 0 ? 'circuit__restclock--done' : ''}`}>
            {clock(restLeft)}
          </div>
          <div className="tiny dim" style={{ marginTop: 10 }}>
            {restLeft === 0 ? 'Rest complete' : 'Rest'}
          </div>
          <div className="circuit__restbar">
            <div className="circuit__restfill" style={{ width: `${100 - (restLeft / REST_SECONDS) * 100}%` }} />
          </div>
          <div style={{ flex: 1 }} />
          <div className="circuit__nextup">
            <div className="label">Next up</div>
            <div className="circuit__nextround">
              Round {round + 1} of {session.rounds}
            </div>
            <div className="tiny dim num" style={{ marginTop: 3 }}>
              {getCircuitExercise(exerciseIds[0]).name} &middot; {getCircuitExercise(exerciseIds[0]).prescription}
            </div>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block circuit__cta"
            onClick={() => {
              circuit.advanceRound(session.id);
              setRestOn(false);
              setScreen('round');
            }}
          >
            {restLeft === 0 ? `Start round ${round + 1}` : 'Start now'}
          </button>
          <button
            type="button"
            className="circuit__linkback"
            onClick={() => {
              setRestLeft(0);
              setRestOn(false);
            }}
          >
            Skip the rest
          </button>
        </div>
      ) : null}

      <Sheet open={confirmExit} onClose={() => setConfirmExit(false)} title="Stop here?">
        <p className="muted small" style={{ marginBottom: 20 }}>
          {doneCount} of {exerciseIds.length} checked off this round. Pausing keeps the session open
          to pick back up; ending it now files what you have done.
        </p>
        <div className="stack">
          <button type="button" className="btn btn--primary btn--block" onClick={() => setConfirmExit(false)}>
            Keep training
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onExit}>
            Pause and save
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              circuit.finishSession(session.id);
              onFinished(session.id);
            }}
          >
            Finish workout now
          </button>
        </div>
      </Sheet>
    </div>
  );
}
