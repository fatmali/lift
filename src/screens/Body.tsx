import { useMemo, useRef, useState } from 'react';
import { CardioSheet } from '../components/CardioSheet';
import { Icon } from '../components/Icon';
import { LineChart } from '../components/LineChart';
import { NumField } from '../components/NumField';
import { PhotoImage } from '../components/PhotoImage';
import { Empty, Notice, SectionHead, Segmented } from '../components/Primitives';
import { Sheet } from '../components/Sheet';
import { currentWeek } from '../domain/schedule';
import { formatShort, formatRelativeDay, today as todayISO } from '../lib/date';
import { num } from '../lib/format';
import { useStore } from '../store/useStore';
import type { Measurement, Pose } from '../types';

type Field = 'bodyweight' | 'waist' | 'hips' | 'thigh' | 'arm';

const FIELDS: { key: Field; label: string; unit: string }[] = [
  { key: 'bodyweight', label: 'Weight', unit: 'kg' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'thigh', label: 'Thigh', unit: 'cm' },
  { key: 'arm', label: 'Arm', unit: 'cm' },
];

const POSES: { value: Pose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
];

export function Body({ onBack }: { onBack?: () => void }) {
  const store = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [field, setField] = useState<Field>('bodyweight');
  const [pose, setPose] = useState<Pose>('front');
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const measurements = useMemo(
    () => [...store.measurements].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [store.measurements],
  );

  const series = measurements
    .filter((m) => typeof m[field] === 'number')
    .map((m) => ({ label: formatShort(m.date), value: m[field] as number }));

  const posePhotos = useMemo(
    () => store.photos.filter((p) => p.pose === pose).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [store.photos, pose],
  );

  const left = posePhotos.find((p) => p.id === compareA) ?? posePhotos[0] ?? null;
  const right =
    posePhotos.find((p) => p.id === compareB) ?? posePhotos[posePhotos.length - 1] ?? null;

  const unitFor = (f: Field) =>
    f === 'bodyweight' ? (store.settings.unit === 'lb' ? 'lb' : 'kg') : 'cm';

  const recentRecovery = useMemo(
    () => [...store.recovery].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5),
    [store.recovery],
  );

  return (
    <div className="screen">
      {onBack ? (
        <button type="button" className="circuit__back" onClick={onBack}>
          <Icon name="back" size={15} /> Progress
        </button>
      ) : null}

      <header className="screen-head" style={onBack ? { marginTop: 24 } : undefined}>
        <div>
          <div className="screen-head__eyebrow">Optional context</div>
          <h1>Body</h1>
        </div>
      </header>

      <Notice icon={<Icon name="scale" size={15} />}>
        These numbers are context, not the scoreboard. Recomposition means the scale can stay still
        while the mirror and the bar both move.
      </Notice>

<div className="split">
        <div className="split__main">
      {/* ── Measurements ─────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Measurements"
          action={
            <button type="button" className="section__action" onClick={() => setAddOpen(true)}>
              Add
            </button>
          }
        />

        {measurements.length ? (
          <>
            <div className="scroll-x" style={{ marginBottom: 12 }}>
              {FIELDS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`chip ${field === f.key ? 'chip--on' : ''}`}
                  onClick={() => setField(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="card">
              <LineChart
                points={series}
                format={(n) => `${num(n)} ${unitFor(field)}`}
                emptyLabel={`No ${FIELDS.find((f) => f.key === field)?.label.toLowerCase()} entries yet`}
              />
            </div>
            <div className="card" style={{ marginTop: 10, padding: '4px 20px' }}>
              <div className="list">
                {[...measurements]
                  .reverse()
                  .slice(0, 6)
                  .map((m) => (
                    <div key={m.id} className="listitem">
                      <span className="listitem__main">
                        <span className="listitem__title">{formatRelativeDay(m.date)}</span>
                        <span className="listitem__sub num">
                          {FIELDS.filter((f) => typeof m[f.key] === 'number')
                            .map((f) => `${f.label} ${m[f.key]}${unitFor(f.key)}`)
                            .join(' · ') || 'No values'}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="btn btn--quiet btn--sm"
                        aria-label="Delete entry"
                        onClick={() => store.deleteMeasurement(m.id)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <Empty
            title="Nothing logged"
            body="Add measurements every 2–4 weeks. Once a week is enough for weight — daily readings mostly measure water."
            action={
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAddOpen(true)}>
                Add first entry
              </button>
            }
          />
        )}
      </section>

</div>

        <div className="split__side">
      {/* ── Photos ───────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Physique photos"
          action={
            <button
              type="button"
              className="section__action"
              onClick={() => fileRef.current?.click()}
            >
              Add {pose}
            </button>
          }
        />

        <Segmented options={POSES} value={pose} onChange={setPose} />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await store.addPhoto(file, pose, todayISO());
            e.target.value = '';
          }}
        />

        {posePhotos.length >= 2 ? (
          <div style={{ marginTop: 12 }}>
            <div className="compare">
              {[left, right].map((photo, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  <div className="photo">
                    {photo ? (
                      <PhotoImage blobKey={photo.blobKey} alt={`${pose} photo`} />
                    ) : null}
                    {photo ? <figcaption className="photo__tag">Week {photo.week}</figcaption> : null}
                  </div>
                  <div className="scroll-x" style={{ marginTop: 8, margin: '8px 0 0' }}>
                    {posePhotos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`chip ${
                          (i === 0 ? left?.id : right?.id) === p.id ? 'chip--on' : ''
                        }`}
                        onClick={() => (i === 0 ? setCompareA(p.id) : setCompareB(p.id))}
                      >
                        W{p.week}
                      </button>
                    ))}
                  </div>
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        <div className="photogrid" style={{ marginTop: 12 }}>
          {posePhotos.map((p) => (
            <div key={p.id} className="photo">
              <PhotoImage blobKey={p.blobKey} alt={`${pose} photo week ${p.week}`} />
              <span className="photo__tag">W{p.week}</span>
              <button
                type="button"
                aria-label="Delete photo"
                onClick={() => void store.deletePhoto(p.id)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 999,
                  padding: 5,
                  color: '#fff',
                  lineHeight: 0,
                }}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          ))}
          <button type="button" className="photo photo--empty" onClick={() => fileRef.current?.click()}>
            <span>
              <Icon name="camera" size={20} />
              <div style={{ marginTop: 6 }}>Add {pose}</div>
            </span>
          </button>
        </div>

        <p className="tiny dim" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Stored locally in your browser — never uploaded, never analysed. Same spot, same lighting,
          every 4 weeks is plenty.
        </p>
      </section>

      {/* ── Cardio ───────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Conditioning log"
          action={
            <button type="button" className="section__action" onClick={() => setCardioOpen(true)}>
              Log
            </button>
          }
        />
        {store.cardio.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {[...store.cardio]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .slice(0, 6)
                .map((c) => (
                  <div key={c.id} className="listitem">
                    <span className="marker">
                      <Icon name="run" size={16} />
                    </span>
                    <span className="listitem__main">
                      <span className="listitem__title" style={{ textTransform: 'capitalize' }}>
                        {c.type === 'easy' ? 'Easy cardio' : c.type}
                      </span>
                      <span className="listitem__sub">
                        {c.minutes} min · {c.effort} effort · {formatRelativeDay(c.date)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      aria-label="Delete cardio session"
                      onClick={() => store.deleteCardio(c.id)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <Empty
            title="No cardio logged"
            body="One or two easy 20–30 minute sessions a week keeps your engine without eating into recovery."
          />
        )}
      </section>

      {/* ── Recovery ─────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead
          title="Recovery"
          action={
            <button type="button" className="section__action" onClick={() => setRecoveryOpen(true)}>
              Check in
            </button>
          }
        />
        {recentRecovery.length ? (
          <div className="card" style={{ padding: '4px 20px' }}>
            <div className="list">
              {recentRecovery.map((r) => (
                <div key={r.date} className="listitem">
                  <span className="marker">
                    <Icon name="moon" size={16} />
                  </span>
                  <span className="listitem__main">
                    <span className="listitem__title">{formatRelativeDay(r.date)}</span>
                    <span className="listitem__sub">
                      {[
                        r.sleepHours ? `${r.sleepHours}h sleep` : null,
                        r.energy ? `${r.energy} energy` : null,
                        r.soreness ? `${r.soreness} soreness` : null,
                        r.stress ? `${r.stress} stress` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty
            title="No check-ins yet"
            body="Energy and soreness are logged automatically when you start a workout. Add a standalone check-in any time."
          />
        )}
      </section>

</div>
      </div>

      <AddMeasurement
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(m) => {
          store.addMeasurement(m);
          setAddOpen(false);
        }}
        unit={store.settings.unit}
      />
      <CardioSheet open={cardioOpen} onClose={() => setCardioOpen(false)} />
      <RecoverySheet open={recoveryOpen} onClose={() => setRecoveryOpen(false)} />
    </div>
  );
}

const LEVEL_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

function RecoverySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logRecovery = useStore((s) => s.logRecovery);
  const existing = useStore((s) => s.recovery.find((r) => r.date === todayISO()));
  const [sleep, setSleep] = useState(existing?.sleepHours ?? 7);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>(existing?.energy ?? 'medium');
  const [soreness, setSoreness] = useState<'low' | 'medium' | 'high'>(existing?.soreness ?? 'low');
  const [stress, setStress] = useState<'low' | 'medium' | 'high'>(existing?.stress ?? 'low');

  const rows: [string, 'low' | 'medium' | 'high', (v: 'low' | 'medium' | 'high') => void][] = [
    ['Energy', energy, setEnergy],
    ['Soreness', soreness, setSoreness],
    ['Stress', stress, setStress],
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Recovery check-in">
      <div className="stack" style={{ gap: 18 }}>
        <div className="field">
          <span className="field__label">Sleep</span>
          <div className="chiprow">
            {[5, 6, 7, 8, 9].map((h) => (
              <button
                key={h}
                type="button"
                className={`chip ${sleep === h ? 'chip--on' : ''}`}
                onClick={() => setSleep(h)}
              >
                {h === 5 ? '<5h' : h === 9 ? '9h+' : `${h}h`}
              </button>
            ))}
          </div>
        </div>
        {rows.map(([label, value, setter]) => (
          <div className="field" key={label}>
            <span className="field__label">{label}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`btn btn--ghost ${value === l ? 'btn--primary' : ''}`}
                  style={{ height: 46 }}
                  onClick={() => setter(l)}
                >
                  {LEVEL_LABEL[l]}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            logRecovery({ date: todayISO(), sleepHours: sleep, energy, soreness, stress });
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}

function AddMeasurement({
  open,
  onClose,
  onSave,
  unit,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Omit<Measurement, 'id'>) => void;
  unit: string;
}) {
  const blockStart = useStore((s) => s.settings.blockStart);
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<Field, number>>({
    bodyweight: 0,
    waist: 0,
    hips: 0,
    thigh: 0,
    arm: 0,
  });

  return (
    <Sheet open={open} onClose={onClose} title="Add measurements">
      <div className="stack" style={{ gap: 16 }}>
        <div className="field">
          <span className="field__label">Date · week {currentWeek(blockStart, date)}</span>
          <input
            className="input"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <span className="field__label">
              {f.label} ({f.key === 'bodyweight' ? unit : f.unit})
            </span>
            <NumField
              className="input num"
              ariaLabel={f.label}
              value={values[f.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            />
          </div>
        ))}

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            const entry: Omit<Measurement, 'id'> = { date };
            FIELDS.forEach((f) => {
              if (values[f.key] > 0) entry[f.key] = values[f.key];
            });
            onSave(entry);
            setValues({ bodyweight: 0, waist: 0, hips: 0, thigh: 0, arm: 0 });
          }}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}
