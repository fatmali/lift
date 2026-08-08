import { num } from '../lib/format';
import type { LoadDecision, LoadOption } from '../domain/progression';
import { Icon } from './Icon';

/**
 * The load decision, asked as a choice rather than as arithmetic.
 *
 * Each option states the load, the rep target it comes with, and why it
 * exists. Nothing is pre-applied — the weight stays where it was until the
 * athlete picks, so the app never quietly adds load on their behalf. It only
 * appears when there is genuinely something to decide.
 */
export function LoadChoice({
  decision,
  unit,
  selected,
  onChoose,
  onSetStart,
}: {
  decision: LoadDecision;
  unit: string;
  selected: LoadOption['id'] | null;
  onChoose: (option: LoadOption) => void;
  onSetStart: () => void;
}) {
  const isFirstTime = decision.options[0]?.id === 'start';

  return (
    <section className="choice" aria-label="Load for this exercise">
      <h3 className="choice__headline">{decision.headline}</h3>
      <p className="choice__detail">{decision.detail}</p>

      {isFirstTime ? (
        <button type="button" className="btn btn--primary btn--block" onClick={onSetStart}>
          Set a starting weight
        </button>
      ) : (
        <div className="choice__options">
          {decision.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`choiceopt ${selected === o.id ? 'choiceopt--on' : ''} ${
                o.recommended ? 'choiceopt--rec' : ''
              }`}
              onClick={() => onChoose(o)}
            >
              <span className="choiceopt__flag caps">{o.recommended ? 'Suggested' : '\u00A0'}</span>
              <span className="choiceopt__top">
                <span className="choiceopt__weight num display">
                  {o.id === 'jump' ? <Icon name="arrowUp" size={13} /> : null}
                  {num(o.weight)}
                </span>
                <span className="choiceopt__unit">{unit}</span>
              </span>
              <span className="choiceopt__target num">aim {o.repTarget}</span>
              <span className="choiceopt__title">{o.title}</span>
              <span className="choiceopt__reason">{o.reason}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
