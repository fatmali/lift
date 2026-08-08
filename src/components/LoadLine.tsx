import { num } from '../lib/format';
import { Icon } from './Icon';

export interface LoadRecord {
  week: number;
  weight: number;
  reps: string;
  /** True when the load moved up from the previous entry. */
  up: boolean;
}

/**
 * The load line: a lift's history read as a ledger rather than a chart.
 * One column per session — the load stamped above the rule, the reps and the
 * week beneath it. Weeks where the bar got heavier are the only thing on the
 * screen allowed to wear the accent.
 */
export function LoadLine({
  records,
  unit,
  inverse = false,
}: {
  records: LoadRecord[];
  unit: string;
  inverse?: boolean;
}) {
  if (!records.length) return null;

  return (
    <div className="loadline">
      <div className="loadline__head">
        <span className="caps">Load line</span>
        <span className="caps">{inverse ? 'Less is better' : `${unit} per session`}</span>
      </div>

      <div className="loadline__track">
        {records.map((r, i) => (
          <div key={`${r.week}-${i}`} className={`loadrec ${r.up ? 'loadrec--up' : ''}`}>
            <div className="loadrec__weight num display">
              {r.up ? <Icon name="arrowUp" size={11} className="loadrec__arrow" /> : null}
              {num(r.weight)}
            </div>
            <div className="loadrec__rule">
              <span className="loadrec__tick" />
            </div>
            <div className="loadrec__reps num">{r.reps}</div>
            <div className="loadrec__week caps">W{r.week}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
