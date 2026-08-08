import { useEffect } from 'react';
import { clock } from '../lib/format';
import { buzz, chime, notify } from '../lib/notify';
import { useStore } from '../store/useStore';
import { useTick, useTimer } from '../store/useTimer';
import { Icon } from './Icon';

export function RestBar({ stacked = false }: { stacked?: boolean }) {
  const { endsAt, duration, label, notified, extend, stop, markNotified } = useTimer();
  const settings = useStore((s) => s.settings);
  const now = useTick(endsAt !== null);
  const remaining = endsAt ? (endsAt - now) / 1000 : 0;
  const done = endsAt !== null && remaining <= 0;

  useEffect(() => {
    if (!done || notified) return;
    markNotified();
    if (settings.sound) chime();
    if (settings.vibrate) buzz([40, 80, 40]);
    void notify('Rest complete', label || 'Back to work.', 'rest');
  }, [done, notified, markNotified, settings.sound, settings.vibrate, label]);

  // Clear the finished bar on its own so it never lingers into the next set.
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(stop, 12_000);
    return () => window.clearTimeout(id);
  }, [done, stop]);

  if (endsAt === null) return null;

  const progress = duration > 0 ? Math.min(1, Math.max(0, 1 - remaining / duration)) : 1;

  return (
    <div
      className="restbar"
      style={{
        // Float clear of whatever sits at the bottom: the session footer while
        // training, the tab bar everywhere else.
        paddingBottom: stacked
          ? 'calc(env(safe-area-inset-bottom) + 88px)'
          : 'calc(env(safe-area-inset-bottom) + var(--tabbar-h) + 10px)',
      }}
    >
      <div className={`restbar__inner ${done ? 'restbar--done' : ''}`}>
        <div className="restbar__fill" style={{ width: `${progress * 100}%` }} />
        <div className="restbar__content">
          <span className="restbar__time num">{done ? 'Go' : clock(remaining)}</span>
          <span className="restbar__label">
            {done ? 'Rest complete — next set' : label || 'Resting'}
          </span>
          {!done ? (
            <button type="button" className="restbar__btn" onClick={() => extend(30)}>
              +30s
            </button>
          ) : null}
          <button
            type="button"
            className="restbar__btn"
            onClick={stop}
            aria-label={done ? 'Dismiss' : 'Skip rest'}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
