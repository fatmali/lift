import type { Readiness } from '../types';

/**
 * A training suggestion, never a diagnosis. Low energy or high soreness earns
 * a lighter day, not a lecture — and never a reason to skip entirely.
 */
export function readinessAdvice(r: Readiness): { tone: 'default' | 'warn' | 'data'; text: string } {
  const drained = r.energy === 'low';
  const sore = r.soreness === 'high';
  if (drained && sore) {
    return {
      tone: 'warn',
      text: 'Low energy and high soreness. Consider dropping a set on the big lifts and keeping every set at RIR 3. Showing up is the win today.',
    };
  }
  if (drained) {
    return {
      tone: 'warn',
      text: 'Consider reducing load slightly today and holding the rep targets.',
    };
  }
  if (sore) {
    return {
      tone: 'warn',
      text: 'Sore going in. Warm up longer, and let the first set tell you what the load should be.',
    };
  }
  if (r.energy === 'high' && r.soreness === 'low') {
    return { tone: 'data', text: 'Good day to push the top sets. Still stop 1–2 reps short.' };
  }
  return { tone: 'default', text: 'Train hard, leave 1–2 reps in reserve, and move on.' };
}
