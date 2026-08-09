import { Icon } from '../components/Icon';
import { CIRCUIT_EXERCISES } from '../data/circuitExercises';
import { fastingRatio } from '../domain/nutrition';
import { SHOPPING_LIST } from '../data/nutrition';
import { WEEKDAY_SHORT } from '../lib/date';
import { plural } from '../lib/format';
import { useCircuitStore } from '../store/useCircuitStore';

export function Plan({
  onEditWorkout,
  onViewMeals,
  onViewShopping,
  onViewStrength,
  onViewLibrary,
  onViewFasting,
}: {
  onEditWorkout: (id: string) => void;
  onViewMeals: () => void;
  onViewShopping: () => void;
  onViewStrength: () => void;
  onViewLibrary: () => void;
  onViewFasting: () => void;
}) {
  const circuit = useCircuitStore();
  const rows = circuit.plan.slice().sort((a, b) => a.weekday - b.weekday);
  const itemCount = SHOPPING_LIST.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <div className="screen-head__eyebrow">Plan</div>
          <h1>Your week</h1>
        </div>
      </header>

      <div className="planlist">
        {rows.map((w) => (
          <button key={w.id} type="button" className="planlist__row" onClick={() => onEditWorkout(w.id)}>
            <span className="planlist__day">{WEEKDAY_SHORT[w.weekday]}</span>
            <span className="planlist__main">
              <span className="planlist__focus">{w.focus}</span>
              <span className="planlist__meta">
                {w.mode === 'strength' ? 'Strength' : 'Functional'} &middot;{' '}
                {plural(w.exerciseIds.length, 'exercise')} &middot; {plural(w.rounds, 'round')}
              </span>
            </span>
            <Icon name="chevron" size={15} className="planlist__chev" />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginTop: 16 }}
        onClick={() => onEditWorkout(circuit.addWorkout())}
      >
        <Icon name="plus" size={16} />
        Add a workout
      </button>

      <div className="label" style={{ marginTop: 34, marginBottom: 4 }}>
        Training
      </div>
      <div className="linklist">
        <button type="button" className="linklist__row" onClick={onViewLibrary}>
          <span className="linklist__name">Exercise library</span>
          <span className="tiny dim num">{Object.keys(CIRCUIT_EXERCISES).length}</span>
        </button>
        <button type="button" className="linklist__row" onClick={onViewStrength}>
          <span className="linklist__name">Strength sessions</span>
          <span className="tiny dim">Traditional sets</span>
        </button>
      </div>

      <div className="label" style={{ marginTop: 34, marginBottom: 4 }}>
        Nutrition
      </div>
      <div className="linklist">
        <button type="button" className="linklist__row" onClick={onViewMeals}>
          <span className="linklist__name">Meal plan</span>
          <span className="tiny dim">This week</span>
        </button>
        <button type="button" className="linklist__row" onClick={onViewShopping}>
          <span className="linklist__name">Shopping list</span>
          <span className="tiny dim num">{plural(itemCount, 'item')}</span>
        </button>
        <button type="button" className="linklist__row" onClick={onViewFasting}>
          <span className="linklist__name">Fasting window</span>
          <span className="tiny dim num">{fastingRatio(circuit)}</span>
        </button>
      </div>
    </div>
  );
}
