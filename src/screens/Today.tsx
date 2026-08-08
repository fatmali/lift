import { useMemo, useState } from 'react';
import { CardioSheet } from '../components/CardioSheet';
import { Icon } from '../components/Icon';
import { Empty, Notice, SectionHead, Stat } from '../components/Primitives';
import { Sheet } from '../components/Sheet';
import { getExercise } from '../data/exercises';
import { BLOCK_WEEKS, DAY_BY_ID, PROGRAM, phaseForWeek } from '../data/program';
import {
  allPRs,
  completedSets,
  groupPRs,
  failureFlag,
  isCompleted,
  progressionQueue,
  sessionVolume,
} from '../domain/progression';
import {
  currentWeek,
  displayWeek,
  missedSlots,
  nextSlot,
  todaysSlot,
  weekCompletion,
  weekStreak,
} from '../domain/schedule';
import { WEEKDAY_LONG, addDays, formatDate, formatRelativeDay, fromISODate, startOfWeek, today as todayISO } from '../lib/date';
import { num, plural, volume as fmtVolume } from '../lib/format';
import { bodyweightOn, useStore } from '../store/useStore';
import type { DayId } from '../types';

const TONE: Record<DayId, string> = {
  lowerA: 'var(--lowerA)',
  upper: 'var(--upper)',
  lowerB: 'var(--lowerB)',
};

export function Today({
  onStart,
  onNavigate,
}: {
  onStart: (sessionId: string) => void;
  onNavigate: (tab: 'progress' | 'body' | 'plan') => void;
}) {
  const store = useStore();
  const { settings, sessions } = store;
  const now = todayISO();
  const [pickDay, setPickDay] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);

  const week = currentWeek(settings.blockStart, now);
  const shownWeek = displayWeek(settings.blockStart, now);
  const phase = phaseForWeek(shownWeek);
  const slotToday = todaysSlot(settings.blockStart, sessions, now);
  const next = nextSlot(settings.blockStart, sessions, now);
  const completion = weekCompletion(shownWeek, settings.blockStart, sessions, now);
  const streak = weekStreak(settings.blockStart, sessions, now);
  const missed = missedSlots(settings.blockStart, sessions, now).filter(
    (s) => s.date >= addDays(now, -6) && !store.dismissed.includes(`missed-${s.date}`),
  );

  const prs = useMemo(
    () => groupPRs(allPRs(sessions, settings.unit)).slice(0, 4),
    [sessions, settings.unit],
  );
  const ready = useMemo(() => progressionQueue(sessions).slice(0, 5), [sessions]);
  const flag = useMemo(() => failureFlag(sessions), [sessions]);

  const weekStart = startOfWeek(now);
  const weekVolume = sessions
    .filter((s) => isCompleted(s) && s.date >= weekStart)
    .reduce((sum, s) => sum + sessionVolume(s, bodyweightOn(store, s.date)), 0);
  const cardioThisWeek = store.cardio.filter((c) => c.date >= weekStart).length;

  const start = (dayId: DayId) => onStart(store.resumeOrStart(dayId, now));

  const activeToday = slotToday?.session && !isCompleted(slotToday.session) ? slotToday.session : null;
  const doneToday = slotToday?.session && isCompleted(slotToday.session) ? slotToday.session : null;

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">{formatDate(now)}</div>
          <h1>Today</h1>
        </div>
        <span className="pill pill--data">
          Week {shownWeek} / {BLOCK_WEEKS}
        </span>
      </header>

      {week > BLOCK_WEEKS ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="pr" icon="✓">
            You finished the 12-week block. Start a new one from Plan — same movements, new
            baselines.
          </Notice>
        </div>
      ) : null}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {slotToday && !doneToday ? (
        <div className="hero" style={{ ['--tone' as string]: TONE[slotToday.day.id] }}>
          <div className="hero__rule" />
          <div className="hero__focus">{slotToday.day.focus}</div>
          <h2 className="hero__title">{slotToday.day.name}</h2>
          <p className="small muted" style={{ marginBottom: 18 }}>
            {slotToday.day.slots.length} exercises · {phase.name} · {phase.rirLabel}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => start(slotToday.day.id)}
          >
            {activeToday ? 'Resume workout' : 'Start workout'}
            <Icon name="chevron" size={17} />
          </button>
          {activeToday ? (
            <p className="tiny dim" style={{ marginTop: 10, textAlign: 'center' }}>
              {activeToday.entries.reduce((n, e) => n + completedSets(e).length, 0)} sets already
              logged
            </p>
          ) : null}
        </div>
      ) : doneToday ? (
        <div className="hero" style={{ ['--tone' as string]: 'var(--done)' }}>
          <div className="hero__rule" />
          <div className="hero__focus">Complete</div>
          <h2 className="hero__title">{DAY_BY_ID[doneToday.dayId].name} done</h2>
          <p className="small muted">
            {fmtVolume(sessionVolume(doneToday, bodyweightOn(store, doneToday.date)))}{' '}
            {settings.unit} moved ·{' '}
            {plural(doneToday.entries.filter((e) => completedSets(e).length).length, 'exercise')}
          </p>
        </div>
      ) : (
        <div className="hero" style={{ ['--tone' as string]: 'var(--text-3)' }}>
          <div className="hero__rule" />
          <div className="hero__focus">Rest day</div>
          <h2 className="hero__title">Recover</h2>
          <p className="small muted">
            Nothing scheduled. Eat enough, sleep enough — that is where the work gets paid out.
          </p>
        </div>
      )}

      {/* ── Next ─────────────────────────────────────────────────────── */}
      {next && (!slotToday || doneToday || next.date !== now) ? (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="row-between">
            <div>
              <div className="label">Next</div>
              <div className="mid" style={{ marginTop: 3 }}>
                {next.date === now ? 'Today' : WEEKDAY_LONG[fromISODate(next.date).getDay()]} ·{' '}
                {next.day.name}
              </div>
              <div className="tiny dim">{next.day.focus}</div>
            </div>
            <span
              className="marker"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: TONE[next.day.id] }}
            >
              {next.day.short}
            </span>
          </div>
        </div>
      ) : null}

      {/* ── Missed ───────────────────────────────────────────────────── */}
      {missed.length ? (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="small" style={{ marginBottom: 12 }}>
            Missed {WEEKDAY_LONG[fromISODate(missed[0].date).getDay()]}. No drama — your next
            session is{' '}
            {next ? WEEKDAY_LONG[fromISODate(next.date).getDay()] : 'coming up'}.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => start(missed[0].day.id)}
            >
              Train it today
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => missed.forEach((m) => store.dismiss(`missed-${m.date}`))}
            >
              Move on
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="statgrid" style={{ marginTop: 10 }}>
        <Stat
          value={`${completion.done}/${completion.total}`}
          label="This week"
          tone={completion.done === completion.total ? 'done' : undefined}
        />
        <Stat value={streak} label={streak === 1 ? 'Week streak' : 'Weeks streak'} />
        <Stat value={fmtVolume(weekVolume)} unit={settings.unit} label="Week volume" />
      </div>

      {/* ── Block progress ───────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="12-week block"
          action={
            <button type="button" className="section__action" onClick={() => onNavigate('plan')}>
              Plan
            </button>
          }
        />
        <div className="card card--quiet">
          <div className="row-between">
            <div>
              <div className="mid">{phase.name}</div>
              <div className="tiny dim" style={{ marginTop: 2, maxWidth: '30ch' }}>
                {phase.intent}
              </div>
            </div>
            <span className="pill">{phase.rirLabel}</span>
          </div>
          <div className="weekdots" aria-label={`Week ${shownWeek} of ${BLOCK_WEEKS}`}>
            {Array.from({ length: BLOCK_WEEKS }, (_, i) => {
              const w = i + 1;
              const { done, total } = weekCompletion(w, settings.blockStart, sessions, now);
              const cls =
                w === shownWeek ? 'weekdot--now' : done >= total && total > 0 ? 'weekdot--done' : '';
              return <span key={w} className={`weekdot ${cls}`} />;
            })}
          </div>
        </div>
      </section>

      {/* ── Ready to progress ────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Ready to progress" />
        {ready.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {ready.map((r) => (
                <div key={r.exerciseId} className="listitem">
                  <span className="marker" style={{ background: 'var(--data-soft)', color: 'var(--data)' }}>
                    <Icon name="arrowUp" size={16} />
                  </span>
                  <span className="listitem__main">
                    <span className="listitem__title">{getExercise(r.exerciseId).name}</span>
                    <span className="listitem__sub num">
                      {r.sets} × {r.repMax} @ {num(r.weight)} {settings.unit} ·{' '}
                      {formatRelativeDay(r.date)}
                    </span>
                  </span>
                  <span className="pill pill--data num">
                    → {num(r.suggested)} {settings.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty
            title="Nothing flagged yet"
            body="When you hit the top of the rep range on every set of an exercise, it shows up here. You decide when to add weight."
          />
        )}
      </section>

      {/* ── Recent PRs ───────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Recent PRs"
          action={
            prs.length ? (
              <button
                type="button"
                className="section__action"
                onClick={() => onNavigate('progress')}
              >
                All
              </button>
            ) : undefined
          }
        />
        {prs.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {prs.map((group) => (
                <div key={group.key} className="listitem">
                  <span className="marker" style={{ background: 'var(--pr-soft)', color: 'var(--pr)' }}>
                    <Icon name="trophy" size={15} />
                  </span>
                  <span className="listitem__main">
                    <span className="listitem__title">{getExercise(group.exerciseId).name}</span>
                    <span className="listitem__sub">
                      {group.headline.detail} · {formatRelativeDay(group.date)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty
            title="No records yet"
            body="Log a couple of sessions and your strength milestones will collect here."
          />
        )}
      </section>

      {/* ── Cardio + extras ──────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Conditioning" />
        <div className="card">
          <div className="row-between">
            <div>
              <div className="mid num">{cardioThisWeek} / 2</div>
              <div className="tiny dim">easy sessions this week · 20–30 min</div>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCardioOpen(true)}>
              <Icon name="plus" size={15} /> Log
            </button>
          </div>
        </div>
      </section>

      {flag ? (
        <div style={{ marginTop: 16 }}>
          <Notice tone="warn" icon="◔">
            You have taken {flag.count} of your last {flag.total} compound sets to failure. Training
            hard is the point; training to failure every time is a tax on recovery.
          </Notice>
        </div>
      ) : null}

      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setPickDay(true)}
          style={{ flex: 1 }}
        >
          Train another day
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onNavigate('body')}
          style={{ flex: 1 }}
        >
          Log body data
        </button>
      </div>

      <Sheet open={pickDay} onClose={() => setPickDay(false)} title="Which session?">
        <div className="stack">
          {PROGRAM.map((d) => (
            <button
              key={d.id}
              type="button"
              className="card card--tap"
              onClick={() => {
                setPickDay(false);
                start(d.id);
              }}
            >
              <div className="row-between">
                <div>
                  <div className="mid">{d.name}</div>
                  <div className="tiny dim">
                    {d.focus} · {d.slots.length} exercises
                  </div>
                </div>
                <span className="marker" style={{ color: TONE[d.id] }}>
                  {d.short}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Sheet>

      <CardioSheet open={cardioOpen} onClose={() => setCardioOpen(false)} />
    </div>
  );
}
