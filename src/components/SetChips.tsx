import type { SetLog } from '../types';

/**
 * Every set of the exercise on one line, readable at a glance from a metre
 * away. Replaces the stack of near-identical rows that had to be visually
 * targeted to hit the right one.
 */
export function SetChips({
  sets,
  activeIndex,
  onSelect,
}: {
  sets: SetLog[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="setchips" aria-label="Sets">
      {sets.map((s, i) => {
        const done = s.reps > 0;
        return (
          <li key={s.id} style={{ flex: 1 }}>
            <button
              type="button"
              className={`setchip ${done ? 'setchip--done' : ''} ${
                i === activeIndex ? 'setchip--on' : ''
              }`}
              onClick={() => onSelect(i)}
              aria-label={
                done ? `Set ${i + 1}: ${s.reps} reps at ${s.weight}. Edit.` : `Set ${i + 1}, not logged`
              }
            >
              <span className="setchip__n caps">{i + 1}</span>
              <span className="setchip__v num display">{done ? s.reps : '–'}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
