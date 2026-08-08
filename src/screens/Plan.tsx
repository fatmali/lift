import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Notice, SectionHead, Switch } from '../components/Primitives';
import { Sheet } from '../components/Sheet';
import { getExercise } from '../data/exercises';
import { BLOCK_WEEKS, PHASES, PROGRAM, REMINDER_COPY, setsForWeek } from '../data/program';
import { currentWeek } from '../domain/schedule';
import { WEEKDAY_LONG, formatDate, startOfWeek, today as todayISO } from '../lib/date';
import { clock } from '../lib/format';
import { permission, requestPermission } from '../lib/notify';
import { useStore } from '../store/useStore';
import type { DayId } from '../types';

const REST_COMPOUND = [90, 120, 150, 180, 240];
const REST_ISOLATION = [45, 60, 75, 90, 120];

export function Plan({ onToast }: { onToast: (msg: string) => void }) {
  const store = useStore();
  const { settings } = store;
  const [openDay, setOpenDay] = useState<DayId | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [notifState, setNotifState] = useState(permission());

  const week = currentWeek(settings.blockStart, todayISO());
  const day = openDay ? PROGRAM.find((d) => d.id === openDay) : null;

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: store.settings,
      sessions: store.sessions,
      variantChoice: store.variantChoice,
      cardio: store.cardio,
      measurements: store.measurements,
      recovery: store.recovery,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lift-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Backup downloaded');
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">Hypertrophy · 3 days</div>
          <h1>Plan</h1>
        </div>
      </header>

      {/* ── Block ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="row-between">
          <div>
            <div className="label">Current block</div>
            <div className="mid" style={{ marginTop: 3 }}>
              Week {Math.min(BLOCK_WEEKS, Math.max(1, week))} of {BLOCK_WEEKS}
            </div>
            <div className="tiny dim">Started {formatDate(settings.blockStart)}</div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmBlock(true)}>
            <Icon name="refresh" size={15} /> Restart
          </button>
        </div>
        <div className="divider" />
        <div className="stack" style={{ gap: 10 }}>
          {PHASES.map((p) => {
            const active = p.weeks.includes(Math.min(BLOCK_WEEKS, Math.max(1, week)));
            return (
              <div key={p.name} className="row-between" style={{ opacity: active ? 1 : 0.55 }}>
                <div>
                  <div className="small" style={{ fontWeight: 580 }}>
                    {p.name}
                    {active ? <span className="pill pill--data" style={{ marginLeft: 8 }}>Now</span> : null}
                  </div>
                  <div className="tiny dim">{p.intent}</div>
                </div>
                <span className="tiny dim num" style={{ flex: 'none' }}>
                  W{p.weeks[0]}
                  {p.weeks.length > 1 ? `–${p.weeks[p.weeks.length - 1]}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Program ──────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Weekly split" />
        <div className="stack">
          {PROGRAM.map((d) => (
            <button
              key={d.id}
              type="button"
              className="card card--tap"
              onClick={() => setOpenDay(d.id)}
            >
              <div className="row-between">
                <div>
                  <div className="label">{WEEKDAY_LONG[d.weekday]}</div>
                  <div className="mid" style={{ marginTop: 3 }}>
                    {d.name}
                  </div>
                  <div className="tiny dim">
                    {d.focus} · {d.slots.length} exercises ·{' '}
                    {d.slots.reduce((n, s) => n + s.sets, 0)} sets
                  </div>
                </div>
                <Icon name="chevron" size={18} className="dim" />
              </div>
            </button>
          ))}
        </div>
        <p className="tiny dim" style={{ marginTop: 12, lineHeight: 1.55 }}>
          The exercise list stays fixed for all twelve weeks on purpose. Stable movements are the
          only way to know whether you actually got stronger.
        </p>
      </section>

      {/* ── Training preferences ─────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Training" />
        <div className="card">
          <div className="field" style={{ marginBottom: 18 }}>
            <span className="field__label">Rest · compound</span>
            <div className="chiprow">
              {REST_COMPOUND.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${settings.restCompound === s ? 'chip--on' : ''}`}
                  onClick={() => store.updateSettings({ restCompound: s })}
                >
                  {clock(s)}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Rest · isolation</span>
            <div className="chiprow">
              {REST_ISOLATION.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${settings.restIsolation === s ? 'chip--on' : ''}`}
                  onClick={() => store.updateSettings({ restIsolation: s })}
                >
                  {clock(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          <Switch
            label="Auto-start rest timer"
            hint="Starts the clock the moment you complete a set."
            checked={settings.autoStartRest}
            onChange={(v) => store.updateSettings({ autoStartRest: v })}
          />
          <Switch
            label="Sound"
            checked={settings.sound}
            onChange={(v) => store.updateSettings({ sound: v })}
          />
          <Switch
            label="Vibration"
            checked={settings.vibrate}
            onChange={(v) => store.updateSettings({ vibrate: v })}
          />
          <Switch
            label="Ask energy and soreness"
            hint="Two taps before a session; suggests a load adjustment when you are beaten up."
            checked={settings.askReadiness}
            onChange={(v) => store.updateSettings({ askReadiness: v })}
          />

          <div className="divider" />

          <div className="field">
            <span className="field__label">Weight unit</span>
            <div className="chiprow">
              {(['kg', 'lb'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`chip ${settings.unit === u ? 'chip--on' : ''}`}
                  onClick={() => store.updateSettings({ unit: u })}
                >
                  {u}
                </button>
              ))}
            </div>
            <span className="tiny dim">
              Display label only — existing entries keep the numbers you typed.
            </span>
          </div>
        </div>
      </section>

      {/* ── Reminders ────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Reminders" />
        <div className="card">
          <Switch
            label="Workout reminders"
            hint="Tuesday · Thursday · Saturday, plus a weekly wrap-up."
            checked={settings.reminders.enabled}
            onChange={async (v) => {
              if (v) {
                const result = await requestPermission();
                setNotifState(result);
                if (result !== 'granted') {
                  onToast('Notifications are blocked in your browser settings');
                  return;
                }
              }
              store.updateSettings({ reminders: { ...settings.reminders, enabled: v } });
            }}
          />

          {settings.reminders.enabled ? (
            <>
              <div className="divider" />
              <TimeRow
                label="Evening before"
                hint="“Lower A tomorrow. 🍑”"
                on={settings.reminders.eveningBeforeOn}
                time={settings.reminders.eveningBefore}
                onToggle={(v) =>
                  store.updateSettings({
                    reminders: { ...settings.reminders, eveningBeforeOn: v },
                  })
                }
                onTime={(t) =>
                  store.updateSettings({ reminders: { ...settings.reminders, eveningBefore: t } })
                }
              />
              <TimeRow
                label="Workout day"
                hint="“Time to make the numbers move.”"
                on={settings.reminders.dayOfOn}
                time={settings.reminders.dayOf}
                onToggle={(v) =>
                  store.updateSettings({ reminders: { ...settings.reminders, dayOfOn: v } })
                }
                onTime={(t) =>
                  store.updateSettings({ reminders: { ...settings.reminders, dayOf: t } })
                }
              />
              <TimeRow
                label="Missed session"
                hint="“Missed today. No drama.”"
                on={settings.reminders.missedOn}
                time={settings.reminders.missedAt}
                onToggle={(v) =>
                  store.updateSettings({ reminders: { ...settings.reminders, missedOn: v } })
                }
                onTime={(t) =>
                  store.updateSettings({ reminders: { ...settings.reminders, missedAt: t } })
                }
              />
              <TimeRow
                label="Weekly wrap-up"
                hint="Sunday summary of the week."
                on={settings.reminders.weeklyOn}
                time={settings.reminders.weeklyAt}
                onToggle={(v) =>
                  store.updateSettings({ reminders: { ...settings.reminders, weeklyOn: v } })
                }
                onTime={(t) =>
                  store.updateSettings({ reminders: { ...settings.reminders, weeklyAt: t } })
                }
              />
              <div className="divider" />
              <div className="stack" style={{ gap: 8 }}>
                <span className="label">Sample copy</span>
                {Object.entries(REMINDER_COPY)
                  .slice(0, 3)
                  .map(([key, copy]) => (
                    <div key={key} className="tiny dim">
                      <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>
                        {copy.title}
                      </strong>{' '}
                      — {copy.body}
                    </div>
                  ))}
              </div>
            </>
          ) : null}

          {notifState === 'unsupported' ? (
            <p className="tiny dim" style={{ marginTop: 12 }}>
              This browser does not support notifications. On iPhone, add Lift to your Home Screen
              first.
            </p>
          ) : null}
        </div>
        <p className="tiny dim" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Reminders are scheduled on this device while the app is installed — there is no server
          sending you anything.
        </p>
      </section>

      {/* ── Data ─────────────────────────────────────────────────────── */}
      <section className="section">
        <SectionHead title="Data" />
        <div className="card stack">
          <div className="tiny dim" style={{ lineHeight: 1.55 }}>
            Everything lives in this browser's storage: sessions, sets, records, measurements,
            photos and preferences. Nothing is uploaded. Export a backup before clearing site data
            or switching devices.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={exportData}>
              <Icon name="download" size={15} /> Export
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => importRef.current?.click()}
            >
              Import
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setConfirmReset(true)}
            >
              Reset
            </button>
          </div>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text());
                store.importAll(parsed);
                onToast('Backup restored');
              } catch {
                onToast('That file could not be read');
              }
              e.target.value = '';
            }}
          />
          <span className="tiny dim">Photos stay on this device and are not part of the export.</span>
        </div>
      </section>

      {/* ── Day detail ───────────────────────────────────────────────── */}
      <Sheet open={Boolean(day)} onClose={() => setOpenDay(null)} title={day ? day.name : ''}>
        {day ? (
          <>
            <p className="small muted" style={{ marginTop: -8, marginBottom: 16 }}>
              {WEEKDAY_LONG[day.weekday]} · {day.focus}
            </p>
            <div className="list">
              {day.slots.map((slot, i) => {
                const ex = getExercise(store.variantChoice[slot.slotId] ?? slot.variants[0]);
                return (
                  <div key={slot.slotId} className="listitem">
                    <span className="marker num">{i + 1}</span>
                    <span className="listitem__main">
                      <span className="listitem__title">
                        {ex.name}
                        {slot.variants.length > 1 ? (
                          <span className="dim"> or {getExercise(slot.variants[1]).name}</span>
                        ) : null}
                      </span>
                      <span className="listitem__sub num">
                        {setsForWeek(slot.sets, Math.max(1, Math.min(BLOCK_WEEKS, week)))} ×{' '}
                        {slot.repMin}
                        {slot.repMax !== slot.repMin ? `–${slot.repMax}` : ''}
                        {ex.unilateral ? ' per side' : ''} · {clock(slot.restSec)} rest
                      </span>
                    </span>
                    {slot.section ? <span className="pill">{slot.section}</span> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet open={confirmBlock} onClose={() => setConfirmBlock(false)} title="Restart the block?">
        <p className="muted small" style={{ marginBottom: 18 }}>
          Week 1 will begin on {formatDate(startOfWeek(todayISO()))}. Your full training history,
          records and measurements are kept — only the block calendar moves.
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              store.updateSettings({ blockStart: startOfWeek(todayISO()) });
              setConfirmBlock(false);
              onToast('New block started at week 1');
            }}
          >
            Start a new block
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--block"
            onClick={() => setConfirmBlock(false)}
          >
            Cancel
          </button>
        </div>
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase everything?">
        <Notice tone="warn" icon="!">
          This deletes every session, record, measurement and preference on this device. It cannot
          be undone.
        </Notice>
        <div className="stack" style={{ marginTop: 18 }}>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => {
              store.resetAll();
              setConfirmReset(false);
              onToast('All data erased');
            }}
          >
            Erase all data
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--block"
            onClick={() => setConfirmReset(false)}
          >
            Keep my data
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function TimeRow({
  label,
  hint,
  on,
  time,
  onToggle,
  onTime,
}: {
  label: string;
  hint: string;
  on: boolean;
  time: string;
  onToggle: (v: boolean) => void;
  onTime: (t: string) => void;
}) {
  return (
    <div className="switchrow" style={{ alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 540 }}>{label}</div>
        <div className="tiny dim">{hint}</div>
      </div>
      <input
        className="input num"
        type="time"
        value={time}
        onChange={(e) => onTime(e.target.value)}
        style={{ width: 116, height: 40, opacity: on ? 1 : 0.4 }}
        disabled={!on}
      />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${label} enabled`}
        className={`switch ${on ? 'switch--on' : ''}`}
        onClick={() => onToggle(!on)}
      />
    </div>
  );
}
