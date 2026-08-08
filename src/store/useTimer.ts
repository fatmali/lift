import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  /** Epoch ms the rest ends at, or null when idle. */
  endsAt: number | null;
  duration: number;
  label: string;
  notified: boolean;
  start: (seconds: number, label: string) => void;
  extend: (seconds: number) => void;
  stop: () => void;
  markNotified: () => void;
}

/**
 * Timestamp-based so the countdown survives a locked screen, a backgrounded
 * tab, or a reload mid-set — the phone is in a pocket for most of the rest.
 */
export const useTimer = create<TimerState>()(
  persist(
    (set, get) => ({
      endsAt: null,
      duration: 0,
      label: '',
      notified: false,
      start: (seconds, label) =>
        set({ endsAt: Date.now() + seconds * 1000, duration: seconds, label, notified: false }),
      extend: (seconds) => {
        const current = get().endsAt ?? Date.now();
        set({
          endsAt: Math.max(Date.now(), current) + seconds * 1000,
          duration: get().duration + seconds,
          notified: false,
        });
      },
      stop: () => set({ endsAt: null, duration: 0, label: '', notified: false }),
      markNotified: () => set({ notified: true }),
    }),
    { name: 'lift-timer-v1' },
  ),
);

/** Re-renders once a second while something is actually counting. */
export function useTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
