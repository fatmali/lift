let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

/** iOS only allows audio after a gesture — call this on the first tap. */
export function primeAudio(): void {
  const a = audio();
  if (a && a.state === 'suspended') void a.resume();
}

/** Two soft marimba-ish tones. Deliberately not an alarm. */
export function chime(): void {
  const a = audio();
  if (!a) return;
  if (a.state === 'suspended') void a.resume();
  const now = a.currentTime;
  [
    [660, 0],
    [880, 0.16],
  ].forEach(([freq, offset]) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.42);
    osc.connect(gain).connect(a.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.45);
  });
}

export function buzz(pattern: number | number[] = [30, 60, 30]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function notify(title: string, body: string, tag: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options: NotificationOptions = {
    body,
    tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    silent: false,
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    // Fall through to the page-level notification.
  }
  new Notification(title, options);
}
