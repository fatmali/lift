import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Stat } from '../components/Primitives';
import { getExercise } from '../data/exercises';
import { DAY_BY_ID } from '../data/program';
import {
  completedSets,
  failureFlag,
  isCompleted,
  lastPerformance,
  groupPRs,
  progressionMessage,
  prsForSession,
  sessionVolume,
} from '../domain/progression';
import { slotAfter, weekCompletion } from '../domain/schedule';
import { WEEKDAY_LONG, fromISODate } from '../lib/date';
import { duration, volume as fmtVolume } from '../lib/format';
import { bodyweightOn, useStore } from '../store/useStore';

export function Completion({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const store = useStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  const unit = store.settings.unit;

  const finished = useMemo(() => store.sessions.filter(isCompleted), [store.sessions]);
  const prs = useMemo(
    () => (session ? prsForSession(session, finished, unit) : []),
    [session, finished, unit],
  );

  const prGroups = useMemo(() => groupPRs(prs), [prs]);

  if (!session) return null;

  const day = DAY_BY_ID[session.dayId];
  const bodyweight = bodyweightOn(store, session.date);
  const logged = session.entries.filter((e) => completedSets(e).length > 0);
  const next = slotAfter(store.settings.blockStart, store.sessions, session.date);
  const week = weekCompletion(session.week, store.settings.blockStart, store.sessions, session.date);
  const flag = failureFlag(store.sessions);
  const prExerciseIds = new Set(prs.map((p) => p.exerciseId));

  return (
    <div className="complete">
      <div className="complete__inner stagger">
        <div className="complete__check">
          <Icon name="check" size={26} />
        </div>

        <div>
          <h1 className="complete__title">Workout complete</h1>
          <p className="muted small" style={{ marginTop: 6 }}>
            {day.name} · {day.focus} · Week {session.week}
            {session.finishedAt ? ` · ${duration(session.finishedAt - session.startedAt)}` : ''}
          </p>
        </div>

        <div className="statgrid" style={{ marginTop: 24 }}>
          <Stat value={`${logged.length}/${session.entries.length}`} label="Exercises" />
          <Stat
            value={fmtVolume(sessionVolume(session, bodyweight))}
            unit={unit}
            label="Total volume"
          />
          <Stat
            value={prGroups.length}
            label={prGroups.length === 1 ? 'PR lift' : 'PR lifts'}
            tone={prGroups.length ? 'pr' : undefined}
          />
        </div>

        {prGroups.length ? (
          <section className="section">
            <h2 className="section__title">Personal records</h2>
            <div className="card" style={{ marginTop: 12, padding: '4px 20px' }}>
              <div className="list">
                {prGroups.map((group) => (
                  <div key={group.key} className="listitem">
                    <span className="marker" style={{ color: 'var(--text-2)' }}>
                      <Icon name="trophy" size={16} />
                    </span>
                    <span className="listitem__main">
                      <span className="listitem__title">{getExercise(group.exerciseId).name}</span>
                      <span className="listitem__sub">
                        {group.headline.detail}
                        {group.headline.previous ? ` · was ${group.headline.previous}` : ''}
                      </span>
                    </span>
                    <span className="pill pill--pr" style={{ flex: 'none' }}>
                      {group.kinds.map((k) => PR_LABEL[k]).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section">
          <h2 className="section__title">Session breakdown</h2>
          <div className="card" style={{ marginTop: 12, padding: '4px 20px' }}>
            <div className="list">
              {logged.map((entry) => {
                const previous = lastPerformance(store.sessions, entry.exerciseId, session.id);
                const msg = progressionMessage(
                  entry,
                  previous?.entry ?? null,
                  prExerciseIds.has(entry.exerciseId),
                  unit,
                );
                const sets = completedSets(entry);
                return (
                  <div key={entry.slotId} className="listitem">
                    <span className="listitem__main">
                      <span className="listitem__title">{getExercise(entry.exerciseId).name}</span>
                      <span className="listitem__sub num">
                        {Math.max(...sets.map((s) => s.weight))} {unit} ·{' '}
                        {sets.map((s) => s.reps).join(' / ')}
                      </span>
                    </span>
                    <span
                      className="tiny"
                      style={{
                        flex: 'none',
                        textAlign: 'right',
                        maxWidth: 132,
                        color: TONE_COLOR[msg.tone],
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {flag ? (
          <div className="notice notice--warn" style={{ marginTop: 20 }}>
            <span className="notice__icon">
              <Icon name="timer" size={15} />
            </span>
            <span>
              {flag.count} of your last {flag.total} compound sets went to RIR 0. You do not need to
              destroy yourself to grow — leaving 1–2 reps in reserve on the big lifts recovers
              better and progresses faster.
            </span>
          </div>
        ) : null}

        <section className="section">
          <div className="card">
            <div className="row-between">
              <div>
                <div className="label">Next workout</div>
                <div className="mid" style={{ marginTop: 4 }}>
                  {next ? next.day.name : 'Block complete'}
                </div>
                {next ? (
                  <div className="tiny dim">
                    {WEEKDAY_LONG[fromISODate(next.date).getDay()]} · {next.day.focus}
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="label">This week</div>
                <div className="mid num" style={{ marginTop: 4 }}>
                  {week.done}/{week.total}
                </div>
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="btn btn--primary btn--block"
          style={{ marginTop: 28 }}
          onClick={onDone}
        >
          Done
        </button>
      </div>
    </div>
  );
}

const PR_LABEL: Record<string, string> = {
  weight: 'Heaviest',
  reps: 'Reps',
  volume: 'Volume',
  e1rm: 'Est. 1RM',
};

const TONE_COLOR: Record<string, string> = {
  pr: 'var(--pr-ink)',
  up: 'var(--pr-ink)',
  flat: 'var(--text-3)',
  down: 'var(--text-3)',
  new: 'var(--text-3)',
};
