import { useMemo, useRef, useState } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
  sub?: string;
}

const W = 320;
const H = 132;
const PAD_X = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 22;

/**
 * Small, dependency-free chart. Scrub with a finger to read exact values —
 * the numbers matter more than the curve.
 */
export function LineChart({
  points,
  format = (n) => `${n}`,
  variant = 'line',
  emptyLabel = 'Not enough data yet',
}: {
  points: ChartPoint[];
  format?: (n: number) => string;
  variant?: 'line' | 'bar';
  emptyLabel?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = rawMax - rawMin;
    // A flat series should read as flat, not as noise amplified to fill the box.
    const min = span === 0 ? rawMin - Math.max(1, rawMin * 0.1) : rawMin - span * 0.18;
    const max = span === 0 ? rawMax + Math.max(1, rawMax * 0.1) : rawMax + span * 0.18;
    const usableW = W - PAD_X * 2;
    const usableH = H - PAD_TOP - PAD_BOTTOM;
    const x = (i: number) =>
      points.length === 1 ? W / 2 : PAD_X + (i / (points.length - 1)) * usableW;
    const y = (v: number) => PAD_TOP + usableH - ((v - min) / (max - min || 1)) * usableH;
    return { x, y, min, max, usableH };
  }, [points]);

  if (points.length === 0) {
    return (
      <div
        className="dim tiny"
        style={{ height: 132, display: 'grid', placeItems: 'center', textAlign: 'center' }}
      >
        {emptyLabel}
      </div>
    );
  }

  const { x, y } = geometry;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${H - PAD_BOTTOM} L${x(0)},${H - PAD_BOTTOM} Z`;
  const active = cursor === null ? points.length - 1 : cursor;
  const barW = Math.max(3, Math.min(22, (W - PAD_X * 2) / points.length - 4));

  const onMove = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(x(i) - rel);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setCursor(best);
  };

  const point = points[active];

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 4 }}>
        <div>
          <div className="mid num">{format(point.value)}</div>
          <div className="tiny dim">
            {point.label}
            {point.sub ? ` · ${point.sub}` : ''}
          </div>
        </div>
        {points.length > 1 ? (
          <div className="tiny dim num" style={{ textAlign: 'right' }}>
            {format(points[0].value)}
            <span aria-hidden="true" style={{ opacity: 0.5, padding: '0 5px' }}>
              &#8594;
            </span>
            {format(points[points.length - 1].value)}
          </div>
        ) : null}
      </div>
      <svg
        ref={ref}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        style={{ height: 132 }}
        role="img"
        aria-label={`Chart with ${points.length} points`}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerMove={(e) => {
          if (e.pressure > 0 || e.buttons > 0) onMove(e.clientX);
        }}
        onPointerLeave={() => setCursor(null)}
      >
        <defs>
          <linearGradient id="lift-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--data)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--data)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line className="chart__grid" x1={0} x2={W} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} />

        {variant === 'bar' ? (
          points.map((p, i) => (
            <rect
              key={`${p.label}-${i}`}
              x={x(i) - barW / 2}
              y={y(p.value)}
              width={barW}
              height={Math.max(2, H - PAD_BOTTOM - y(p.value))}
              rx={3}
              fill={i === active ? 'var(--data)' : 'var(--surface-3)'}
            />
          ))
        ) : (
          <>
            <path className="chart__area" d={area} />
            <path className="chart__line" d={line} />
            {points.map((p, i) => (
              <circle
                key={`${p.label}-${i}`}
                className="chart__dot"
                cx={x(i)}
                cy={y(p.value)}
                r={i === active ? 4 : 2.6}
              />
            ))}
          </>
        )}

        {points.length > 1 ? (
          <line
            className="chart__cursor"
            x1={x(active)}
            x2={x(active)}
            y1={PAD_TOP - 8}
            y2={H - PAD_BOTTOM}
          />
        ) : null}

        <text className="chart__axis" x={PAD_X} y={H - 6}>
          {points[0].label}
        </text>
        {points.length > 1 ? (
          <text className="chart__axis" x={W - PAD_X} y={H - 6} textAnchor="end">
            {points[points.length - 1].label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
