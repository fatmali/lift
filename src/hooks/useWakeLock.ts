import { useEffect } from 'react';

interface Sentinel {
  release: () => Promise<void>;
}

/**
 * Holds the screen on for the duration of a workout.
 *
 * A phone that sleeps between sets means unlocking with chalk on your hands,
 * at an angle, while the rest clock runs. The lock is re-acquired on
 * visibilitychange because the browser drops it whenever the tab is hidden.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const api = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<Sentinel> } })
      .wakeLock;
    if (!active || !api) return;

    let sentinel: Sentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (released || document.visibilityState !== 'visible') return;
      try {
        sentinel = await api.request('screen');
      } catch {
        // Denied, low battery, or unsupported — the workout still works.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
