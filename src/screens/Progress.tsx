import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { LineChart } from '../components/LineChart';
import { LoadLine, type LoadRecord } from '../components/LoadLine';
import { Empty, SectionHead, Segmented, Stat } from '../components/Primitives';
import { getExercise } from '../data/exercises';
import { BLOCK_WEEKS, TRACKED_LIFTS } from '../data/program';
import {
  allPRs,
  bestsFor,
  completedSets,
  groupPRs,
  historyFor,
  isCompleted,
  sessionVolume,
} from '../domain/progression';
import { adherence, currentWeek, weekSchedule } from '../domain/schedule';
import { exerciseSeries, muscleWeeklyTargets, setsByMuscle, weekSummary } from '../domain/stats';
import { formatDate, formatRelativeDay, today as todayISO } from '../lib/date';
import { num, volume as fmtVolume } from '../lib/format';
import { bodyweightOn, useStore } from '../store/useStore';

type Metric = 'weight' | 'e1rm' | 'volume' | 'reps';

export function Progress() {
  const store = useStore();
  const { sessions, settings } = store;
  const unit = settings.unit;
  const now = todayISO();
  const finished = useMemo(() => sessions.filter(isCompleted), [sessions]);

  const trained = useMemo(() => {
    const ids = new Set<string>();
    finished.forEach((s) =>
      s.entries.forEach((e) => {
        if (completedSets(e).length) ids.add(e.exerciseId);
      }),
    );
    const tracked = TRACKED_LIFTS.filter((id) => ids.has(id));
    const rest = [...ids].filter((id) => !TRACKED_LIFTS.includes(id));
    return [...tracked, ...rest];
  }, [finished]);

  const [selected, setSelected] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('weight');
  const exerciseId = selected && trained.includes(selected) ? selected : (trained[0] ?? null);

  const week = currentWeek(settings.blockStart, now);
  const shownWeek = Math.min(BLOCK_WEEKS, Math.max(1, week));
  // Follows the log until the athlete navigates away from it.
  const lastLoggedWeek = useMemo(() => {
    const weeks = finished.map((s) => s.week).filter((w) => w >= 1 && w <= BLOCK_WEEKS);
    return weeks.length ? Math.max(...weeks) : shownWeek;
  }, [finished, shownWeek]);
  const [pickedWeek, setPickedWeek] = useState<number | null>(null);
  const summaryWeek = pickedWeek ?? lastLoggedWeek;
  const setSummaryWeek = (fn: (w: number) => number) => setPickedWeek(fn(summaryWeek));

  const prs = useMemo(() => allPRs(sessions, unit), [sessions, unit]);
  const prGroups = useMemo(() => groupPRs(prs), [prs]);
  const totalVolume = finished.reduce((sum, s) => sum + sessionVolume(s, bodyweightOn(store, s.date)), 0);
  const rate = adherence(settings.blockStart, sessions, now);

  const series = useMemo(
    () => (exerciseId ? exerciseSeries(finished, exerciseId) : []),
    [finished, exerciseId],
  );
  const loadRecords = useMemo<LoadRecord[]>(() => {
    const inverse = exerciseId ? getExercise(exerciseId).inverseLoad : false;
    return series.map((p, i) => {
      const before = series[i - 1]?.topWeight;
      const up =
        before !== undefined && (inverse ? p.topWeight < before : p.topWeight > before);
      return { week: p.week, weight: p.topWeight, reps: p.sets, up };
    });
  }, [series, exerciseId]);
  const bests = useMemo(
    () => (exerciseId ? bestsFor(historyFor(finished, exerciseId)) : null),
    [finished, exerciseId],
  );

  const summary = useMemo(
    () =>
      weekSummary(
        summaryWeek,
        settings.blockStart,
        sessions,
        prs,
        bodyweightOn(store, now),
        unit,
        now,
      ),
    [summaryWeek, settings.blockStart, sessions, prs, store, unit, now],
  );

  const exercise = exerciseId ? getExercise(exerciseId) : null;
  const metricOptions: { value: Metric; label: string }[] = [
    { value: 'weight', label: exercise?.inverseLoad ? 'Assist' : 'Weight' },
    ...(exercise?.trackE1RM ? [{ value: 'e1rm' as const, label: 'Est. 1RM' }] : []),
    { value: 'volume', label: 'Volume' },
    { value: 'reps', label: 'Reps' },
  ];
  const activeMetric = metricOptions.some((o) => o.value === metric) ? metric : 'weight';

  const chartPoints = series.map((p) => ({
    label: p.label,
    value:
      activeMetric === 'weight'
        ? p.topWeight
        : activeMetric === 'e1rm'
          ? p.e1rm
          : activeMetric === 'volume'
            ? p.volume
            : p.reps,
    sub: p.bestSet,
  }));

  const muscleCounts = useMemo(() => {
    const ids = new Set(
      weekSchedule(shownWeek, settings.blockStart, sessions, now)
        .map((slot) => slot.session?.id)
        .filter(Boolean),
    );
    return setsByMuscle(finished.filter((s) => ids.has(s.id)));
  }, [shownWeek, settings.blockStart, sessions, finished, now]);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">Block 1 · 12 weeks</div>
          <h1>Progress</h1>
        </div>
      </header>

      <div className="statgrid">
        <Stat value={finished.length} label="Sessions" />
        <Stat value={fmtVolume(totalVolume)} unit={unit} label="Total volume" />
        <Stat value={prGroups.length} label="PRs" tone={prGroups.length ? 'pr' : undefined} />
      </div>

      {finished.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <Empty
            title="No training data yet"
            body="Your strength curves, records and weekly summaries appear here after your first logged session."
          />
        </div>
      ) : null}

      {/* ── Strength progression ─────────────────────────────────────── */}
      {exerciseId && exercise ? (
        <section className="section">
          <SectionHead title="Strength progression" />
          <div className="scroll-x" style={{ marginBottom: 12 }}>
            {trained.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${id === exerciseId ? 'chip--on' : ''}`}
                onClick={() => setSelected(id)}
              >
                {getExercise(id).name}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 10 }}>
            <LoadLine records={loadRecords} unit={unit} inverse={exercise.inverseLoad} />
          </div>

          <div className="card">
            <Segmented options={metricOptions} value={activeMetric} onChange={setMetric} />
            <div style={{ marginTop: 16 }}>
              <LineChart
                points={chartPoints}
                variant={activeMetric === 'volume' ? 'bar' : 'line'}
                format={(n) =>
                  activeMetric === 'reps' ? `${n} reps` : `${num(n)} ${unit}`
                }
                emptyLabel="Log this lift twice to see a trend."
              />
            </div>

            {bests ? (
              <>
                <div className="divider" />
                <div className="statgrid">
                  <Stat
                    value={num(bests.weight)}
                    unit={unit}
                    label={exercise.inverseLoad ? 'Least assist' : 'Heaviest'}
                  />
                  <Stat value={bests.reps} label="Rep PR" />
                  <Stat
                    value={exercise.trackE1RM ? num(bests.e1rm) : fmtVolume(bests.volume)}
                    unit={unit}
                    label={exercise.trackE1RM ? 'Est. 1RM' : 'Best volume'}
                  />
                </div>
              </>
            ) : null}
          </div>

        </section>
      ) : null}

      {/* ── Weekly summary ───────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Weekly summary"
          action={
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="section__action"
                onClick={() => setSummaryWeek((w) => Math.max(1, w - 1))}
                aria-label="Previous week"
              >
                <Icon name="back" size={15} />
              </button>
              <span className="section__action num">Week {summaryWeek}</span>
              <button
                type="button"
                className="section__action"
                onClick={() => setSummaryWeek((w) => Math.min(BLOCK_WEEKS, w + 1))}
                aria-label="Next week"
              >
                <Icon name="chevron" size={15} />
              </button>
            </span>
          }
        />
        <div className="card">
          <div className="statgrid">
            <Stat
              value={`${summary.workouts}/${summary.scheduled}`}
              label="Workouts"
              tone={summary.workouts === summary.scheduled ? 'done' : undefined}
            />
            <Stat value={fmtVolume(summary.volume)} unit={unit} label="Volume" />
            <Stat
              value={groupPRs(summary.prs).length}
              label="PRs"
              tone={summary.prs.length ? 'pr' : undefined}
            />
          </div>

          <div className="divider" />

          <div className="stack" style={{ gap: 14 }}>
            <Line
              label="Strongest lift"
              value={summary.strongest ? summary.strongest.name : '—'}
              sub={summary.strongest?.detail}
            />
            <Line
              label="Most improved"
              value={summary.mostImproved ? summary.mostImproved.name : '—'}
              sub={summary.mostImproved?.detail ?? 'Needs two weeks of data'}
            />
            <Line label="Next week" value={summary.focus} />
          </div>
        </div>
      </section>

      {/* ── Weekly volume by muscle ──────────────────────────────────── */}
      <section className="section">
        <SectionHead title={`Week ${shownWeek} sets by muscle`} />
        <div className="card stack" style={{ gap: 10 }}>
          {muscleWeeklyTargets().map((t) => {
            const value = muscleCounts[t.group] ?? 0;
            const ratio = Math.min(1, value / t.target);
            return (
              <div key={t.group}>
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <span className="small">{t.label}</span>
                  <span className="tiny dim num">
                    {value} / {t.target} sets
                  </span>
                </div>
                <div className="progressline">
                  <div
                    className="progressline__fill"
                    style={{
                      width: `${ratio * 100}%`,
                      background: ratio >= 1 ? 'var(--accent)' : 'var(--text-3)',
                    }}
                  />
                </div>
              </div>
            );
          })}
          <p className="tiny dim" style={{ marginTop: 4, lineHeight: 1.5 }}>
            Targets are weekly direct working sets. Arms sit at 5–8 on purpose — proportional, not
            maximal.
          </p>
        </div>
      </section>

      {/* ── Consistency ──────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Consistency"
          action={
            <span className="section__action num">
              {rate.done}/{rate.scheduled} sessions
            </span>
          }
        />
        <div className="card stack" style={{ gap: 5 }}>
          {Array.from({ length: BLOCK_WEEKS }, (_, i) => i + 1).map((w) => (
            <div key={w} className="grid12">
              <span className="tiny dim num">W{w}</span>
              {weekSchedule(w, settings.blockStart, sessions, now).map((slot) => (
                <span
                  key={slot.day.id}
                  className={`gridcell ${
                    slot.status === 'done'
                      ? 'gridcell--done'
                      : slot.status === 'missed'
                        ? 'gridcell--missed'
                        : slot.status === 'upcoming'
                          ? 'gridcell--future'
                          : ''
                  }`}
                  title={`${slot.day.name} · ${formatDate(slot.date)}`}
                >
                  {slot.day.short}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── All PRs ──────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Personal records" />
        {prGroups.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {prGroups.slice(0, 25).map((group) => (
                <div key={group.key} className="listitem">
                  <span className="marker" style={{ color: 'var(--text-2)' }}>
                    <Icon name="trophy" size={15} />
                  </span>
                  <span className="listitem__main">
                    <span className="listitem__title">{getExercise(group.exerciseId).name}</span>
                    <span className="listitem__sub">
                      {group.kinds.map((k) => PR_LABEL[k]).join(' · ')} · {group.headline.detail} ·{' '}
                      {formatRelativeDay(group.date)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty title="No PRs yet" body="They arrive on their own once the numbers start moving." />
        )}
      </section>
    </div>
  );
}

function Line({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="small" style={{ marginTop: 3, fontWeight: 550 }}>
        {value}
      </div>
      {sub ? <div className="tiny dim">{sub}</div> : null}
    </div>
  );
}

const PR_LABEL: Record<string, string> = {
  weight: 'Heaviest',
  reps: 'Rep PR',
  volume: 'Volume',
  e1rm: 'Est. 1RM',
};
