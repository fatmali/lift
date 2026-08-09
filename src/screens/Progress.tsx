import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Empty } from '../components/Primitives';
import { PhotoImage } from '../components/PhotoImage';
import { MUSCLE_LABEL } from '../data/exercises';
import { consistency, loadMoves, muscleBalance } from '../domain/circuitProgress';
import { addDays, formatShort, today as todayISO } from '../lib/date';
import { num, plural } from '../lib/format';
import { loadLabel, useCircuitStore } from '../store/useCircuitStore';
import { useStore } from '../store/useStore';
import type { Measurement } from '../types';

type MetricKey = 'waist' | 'bodyweight' | 'hips';

const METRICS: { key: MetricKey; label: string; unit: string; goodDirection: -1 | 0 }[] = [
  { key: 'waist', label: 'Waist', unit: 'cm', goodDirection: -1 },
  { key: 'bodyweight', label: 'Weight', unit: 'kg', goodDirection: -1 },
  { key: 'hips', label: 'Hips', unit: 'cm', goodDirection: 0 },
];

/** First and most recent reading of a metric, so we show a trend not a blip. */
function trend(measurements: Measurement[], key: MetricKey) {
  const withValue = measurements
    .filter((m) => typeof m[key] === 'number')
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!withValue.length) return null;
  const from = withValue[0][key] as number;
  const to = withValue[withValue.length - 1][key] as number;
  return { from, to, delta: to - from, readings: withValue.length };
}

export function Progress({ onLogBody }: { onLogBody: () => void }) {
  const circuit = useCircuitStore();
  const { measurements, photos } = useStore();
  const now = todayISO();

  const moves = useMemo(() => loadMoves(circuit), [circuit]);
  const streak = useMemo(() => consistency(circuit, now), [circuit, now]);
  const balance = useMemo(
    () => muscleBalance(circuit, addDays(now, -28)),
    [circuit, now],
  );
  const topCount = balance[0]?.count ?? 0;

  const gained = moves.filter((m) => m.direction > 0);
  const headline =
    streak.total === 0
      ? 'Nothing logged yet'
      : `${plural(streak.total, 'session')} in ${streak.weeks} weeks`;

  const story =
    streak.total === 0
      ? 'Finish a workout and your strength, consistency and training balance start collecting here.'
      : gained.length
        ? `${plural(gained.length, 'lift has', 'lifts have')} gone up since you started. ${
            balance.length > 1
              ? `${MUSCLE_LABEL[balance[0].muscle]} is carrying the block; ${MUSCLE_LABEL[
                  balance[balance.length - 1].muscle
                ].toLowerCase()} is the thin spot.`
              : ''
          }`
        : 'Loads are holding steady. Consistency first, then the numbers move.';

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">Progress</div>
          <h1>{headline}</h1>
        </div>
      </header>

      <p className="small muted" style={{ maxWidth: '34ch' }}>{story}</p>

      {/* ── Strength ────────────────────────────────────────────────────── */}
      <div className="label" style={{ marginTop: 34, marginBottom: 4 }}>
        Strength
      </div>
      {moves.length ? (
        <div className="movelist">
          {moves.slice(0, 6).map((m) => (
            <div key={m.exerciseId} className="movelist__row">
              <Icon
                name={m.direction > 0 ? 'arrowUp' : 'minus'}
                size={16}
                className={m.direction > 0 ? 'movelist__up' : 'movelist__flat'}
              />
              <span className="movelist__name">{m.name}</span>
              <span className="num movelist__val">
                {m.direction === 0 ? loadLabel(m.to) : `${loadLabel(m.from)} → ${loadLabel(m.to)}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Not enough history"
          body="Train an exercise twice and the change in load shows up here."
        />
      )}

      {/* ── Consistency ─────────────────────────────────────────────────── */}
      <div className="label" style={{ marginTop: 34, marginBottom: 4 }}>
        Consistency
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span className="num consistency__count">{streak.total}</span>
        <span className="tiny dim">
          {streak.total === 1 ? 'workout' : 'workouts'} across {streak.weeks} weeks
        </span>
      </div>
      <div className="consistency__grid">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`consistency__cell ${
              i < streak.total ? 'consistency__cell--on' : ''
            } ${i === streak.total ? 'consistency__cell--next' : ''}`}
          />
        ))}
      </div>

      {/* ── Muscle focus ────────────────────────────────────────────────── */}
      {balance.length ? (
        <>
          <div className="label" style={{ marginTop: 34, marginBottom: 12 }}>
            Muscle focus &middot; last 4 weeks
          </div>
          <div className="balance">
            {balance.map((b) => (
              <div key={b.muscle}>
                <div className="balance__head">
                  <span>{MUSCLE_LABEL[b.muscle]}</span>
                  <span className="num dim">{plural(b.count, 'set')}</span>
                </div>
                <div className="meter">
                  <div
                    className="meter__fill"
                    style={{ width: `${topCount ? (b.count / topCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="label" style={{ marginTop: 38, marginBottom: 4 }}>
        Body
      </div>
      {measurements.length ? (
        <div className="movelist">
          {METRICS.map((metric) => {
            const t = trend(measurements, metric.key);
            if (!t) return null;
            const moved = t.readings > 1 && t.delta !== 0;
            const good = moved && metric.goodDirection === -1 && t.delta < 0;
            return (
              <div key={metric.key} className="movelist__row">
                <Icon
                  name={!moved ? 'minus' : t.delta < 0 ? 'arrowDown' : 'arrowUp'}
                  size={16}
                  className={good ? 'movelist__up' : 'movelist__flat'}
                />
                <span className="movelist__name">{metric.label}</span>
                <span className="num movelist__val">
                  {moved ? `${num(t.from)} → ${num(t.to)} ${metric.unit}` : `${num(t.to)} ${metric.unit}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Nothing logged"
          body="Weight, waist and hips every 2–4 weeks is enough. Trends matter; daily readings mostly measure water."
        />
      )}
      {measurements.length ? (
        <div className="tiny dim" style={{ marginTop: 12 }}>
          Trends across your logged readings, not daily numbers.
        </div>
      ) : null}

      <div className="photostrip">
        {photos.slice(-2).map((p) => (
          <figure key={p.id} className="photostrip__slot">
            <PhotoImage blobKey={p.blobKey} alt={`${p.pose} on ${formatShort(p.date)}`} />
            <figcaption className="photostrip__cap">{formatShort(p.date)}</figcaption>
          </figure>
        ))}
        <button type="button" className="photostrip__add" onClick={onLogBody}>
          <Icon name="camera" size={18} />
          Add photo
        </button>
      </div>

      <button type="button" className="btn btn--ghost btn--block" style={{ marginTop: 14 }} onClick={onLogBody}>
        Log body data
      </button>
    </div>
  );
}
