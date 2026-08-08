import { useMemo, useState } from 'react';
import { CardioSheet } from '../components/CardioSheet';
import { Icon } from '../components/Icon';
import { Empty, Notice, SectionHead, Stat } from '../components/Primitives';
import { Sheet } from '../components/Sheet';
import { getExercise } from '../data/exercises';
import { BLOCK_WEEKS, DAY_BY_ID, PROGRAM, phaseForWeek, setsForWeek } from '../data/program';
import {
  allPRs,
  completedSets,
  groupPRs,
  failureFlag,
  isCompleted,
  lastPerformance,
  progressionQueue,
  sessionVolume,
  topWeight,
} from '../domain/progression';
import {
  currentWeek,
  displayWeek,
  hasBlockStarted,
  missedSlots,
  nextSlot,
  todaysSlot,
  weekCompletion,
  weekStreak,
} from '../domain/schedule';
import {
  WEEKDAY_LONG,
  addDays,
  daysBetween,
  formatDate,
  formatRelativeDay,
  fromISODate,
  startOfWeek,
  today as todayISO,
} from '../lib/date';
import { num, plural, volume as fmtVolume } from '../lib/format';
import { bodyweightOn, useStore } from '../store/useStore';
import type { DayId } from '../types';

/* Days differ by their letter mark and by type, not by hue — the only
   colour in the palette is reserved for progression. */
const CHALK = 'var(--accent)';

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
  const started = hasBlockStarted(settings.blockStart, now);
  const shownWeek = displayWeek(settings.blockStart, now);
  const phase = phaseForWeek(shownWeek);
  const slotToday = todaysSlot(settings.blockStart, sessions, now);
  const next = nextSlot(settings.blockStart, sessions, now);
  const completion = weekCompletion(shownWeek, settings.blockStart, sessions, now);
  const streak = weekStreak(settings.blockStart, sessions, now);
  const missed = !started
    ? []
    : missedSlots(settings.blockStart, sessions, now).filter(
        (s) => s.date >= addDays(now, -6) && !store.dismissed.includes(`missed-${s.date}`),
      );

  const prs = useMemo(
    () => groupPRs(allPRs(sessions, settings.unit)).slice(0, 4),
    [sessions, settings.unit],
  );
  const ready = useMemo(() => progressionQueue(sessions).slice(0, 5), [sessions]);

  const manifest = useMemo(() => {
    if (!slotToday) return [];
    const flagged = new Set(progressionQueue(sessions).map((r) => r.exerciseId));
    return slotToday.day.slots.map((slot) => {
      const exerciseId = store.variantChoice[slot.slotId] ?? slot.variants[0];
      const last = lastPerformance(sessions, exerciseId);
      return {
        slotId: slot.slotId,
        name: getExercise(exerciseId).name,
        load: last ? topWeight(last.entry) : null,
        sets: setsForWeek(slot.sets, shownWeek),
        repMin: slot.repMin,
        repMax: slot.repMax,
        up: flagged.has(exerciseId),
      };
    });
  }, [slotToday, sessions, store.variantChoice, shownWeek]);
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
        <span className="pill num week-pill">
          Week {shownWeek} / {BLOCK_WEEKS}
        </span>
      </header>

      {week > BLOCK_WEEKS ? (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="pr" icon={<Icon name="check" size={15} />}>
            You finished the 12-week block. Start a new one from Plan — same movements, new
            baselines.
          </Notice>
        </div>
      ) : null}

<div className="split">
        <div className="split__main">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {slotToday && !doneToday ? (
        <div className="hero" style={{ ['--tone' as string]: CHALK }}>
          <div className="hero__rule" />
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="hero__focus">
                {WEEKDAY_LONG[fromISODate(now).getDay()]} · {phase.name} · {phase.rirLabel}
              </div>
              <h2 className="hero__title">{slotToday.day.name}</h2>
              <div className="tiny dim">{slotToday.day.focus}</div>
            </div>
            <span className="marker" style={{ flex: 'none' }}>
              {slotToday.day.short}
            </span>
          </div>

          <ul className="manifest">
            {manifest.slice(0, 4).map((m) => (
              <li key={m.slotId} className="manifest__row">
                <span className="manifest__name">{m.name}</span>
                <span
                  className={`manifest__load num display ${
                    m.up ? 'manifest__load--up' : m.load ? '' : 'manifest__load--empty'
                  }`}
                >
                  {m.up ? <Icon name="arrowUp" size={11} /> : null}
                  {m.load ? num(m.load) : '—'}
                </span>
                <span className="manifest__reps num">
                  {m.sets}&times;{m.repMin}
                  {m.repMax !== m.repMin ? `\u2013${m.repMax}` : ''}
                </span>
              </li>
            ))}
            {manifest.length > 4 ? (
              <li className="manifest__more caps">+{manifest.length - 4} more exercises</li>
            ) : null}
          </ul>

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
        <div className="hero" style={{ ['--tone' as string]: CHALK }}>
          <div className="hero__rule" />
          <div className="hero__focus">Complete</div>
          <h2 className="hero__title">{DAY_BY_ID[doneToday.dayId].name} done</h2>
          <p className="small muted">
            {fmtVolume(sessionVolume(doneToday, bodyweightOn(store, doneToday.date)))}{' '}
            {settings.unit} moved ·{' '}
            {plural(doneToday.entries.filter((e) => completedSets(e).length).length, 'exercise')}
          </p>
        </div>
      ) : !started && next ? (
        <div className="hero" style={{ ['--tone' as string]: CHALK }}>
          <div className="hero__rule" />
          <div className="hero__focus">
            Block 1 · starts in {plural(daysBetween(now, next.date), 'day')}
          </div>
          <h2 className="hero__title">{next.day.name}</h2>
          <div className="tiny dim">
            {WEEKDAY_LONG[fromISODate(next.date).getDay()]} {formatDate(next.date).slice(4)} ·{' '}
            {next.day.focus}
          </div>
          <ul className="manifest">
            {PROGRAM.map((d) => (
              <li key={d.id} className="manifest__row">
                <span className="manifest__name">{d.name}</span>
                <span className="manifest__load num display manifest__load--empty">
                  {WEEKDAY_LONG[d.weekday].slice(0, 3)}
                </span>
                <span className="manifest__reps num">{d.slots.length} ex</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => onNavigate('plan')}
          >
            Read the plan
            <Icon name="chevron" size={17} />
          </button>
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
      {next && started && (!slotToday || doneToday || next.date !== now) ? (
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
              style={{ background: 'transparent', border: '1px solid var(--line)' }}
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
            {missed.length === 1
              ? `Missed ${WEEKDAY_LONG[fromISODate(missed[0].date).getDay()]}.`
              : `Missed ${missed.length} sessions.`}{' '}
            No drama —{' '}
            {!next
              ? 'pick it back up whenever.'
              : next.date === now
                ? `${next.day.name} is ready when you are.`
                : `your next session is ${WEEKDAY_LONG[fromISODate(next.date).getDay()]}.`}
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
        {started ? (
          <>
            <Stat
              value={`${completion.done}/${completion.total}`}
              label="This week"
              tone={completion.done === completion.total ? 'done' : undefined}
            />
            <Stat value={streak} label={streak === 1 ? 'Week streak' : 'Weeks streak'} />
            <Stat value={fmtVolume(weekVolume)} unit={settings.unit} label="Week volume" />
          </>
        ) : (
          <>
            <Stat value={BLOCK_WEEKS} label="Weeks" />
            <Stat value={PROGRAM.length} label="Days a week" />
            <Stat
              value={PROGRAM.reduce((n, d) => n + d.slots.length, 0)}
              label="Movements"
            />
          </>
        )}
      </div>

      {/* ── Ready to progress ────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Ready to progress" />
        {ready.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {ready.map((r) => (
                <div key={r.exerciseId} className="listitem">
                  <span className="marker" style={{ color: 'var(--text-2)' }}>
                    <Icon name="arrowUp" size={16} />
                  </span>
                  <span className="listitem__main">
                    <span className="listitem__title">{getExercise(r.exerciseId).name}</span>
                    <span className="listitem__sub num">
                      {r.sets} × {r.repMax} @ {num(r.weight)} {settings.unit} ·{' '}
                      {formatRelativeDay(r.date)}
                    </span>
                  </span>
                  <span className="pill pill--pr num">
                    <Icon name="arrowUp" size={12} />
                    {num(r.suggested)} {settings.unit}
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

</div>

        <div className="split__side">
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
                  <span className="marker" style={{ color: 'var(--text-2)' }}>
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
          <Notice tone="warn" icon={<Icon name="timer" size={15} />}>
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

</div>
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
                <span className="marker">{d.short}</span>
              </div>
            </button>
          ))}
        </div>
      </Sheet>

      <CardioSheet open={cardioOpen} onClose={() => setCardioOpen(false)} />
    </div>
  );
}
