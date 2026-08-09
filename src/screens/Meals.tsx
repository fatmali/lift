import { Icon } from '../components/Icon';
import { workoutOn } from '../data/circuitProgram';
import { MEAL_PLAN } from '../data/nutrition';
import { addDays, startOfWeek, today as todayISO, weekdayOf, WEEKDAY_LONG } from '../lib/date';
import { isMealLogged } from '../domain/nutrition';
import { useCircuitStore } from '../store/useCircuitStore';

export function Meals({
  onBack,
  onOpenRecipe,
  onViewShopping,
}: {
  onBack: () => void;
  onOpenRecipe: (recipeId: string) => void;
  onViewShopping: () => void;
}) {
  const circuit = useCircuitStore();
  const now = todayISO();
  // Monday-based week, so the plan reads the way the week is lived.
  const weekStart = startOfWeek(now);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Back
      </button>

      <header className="screen-head" style={{ marginTop: 24 }}>
        <div>
          <div className="screen-head__eyebrow">Meal plan</div>
          <h1>This week</h1>
        </div>
      </header>

      <p className="small muted" style={{ maxWidth: '36ch' }}>
        High protein, high fibre, carbs where the training is. Training days carry more.
      </p>

      {days.map((date) => {
        const weekday = weekdayOf(date);
        const meals = MEAL_PLAN[weekday] ?? [];
        const training = !!workoutOn(circuit.plan, weekday);
        return (
          <section key={date} className="mealday">
            <div className="mealday__head">
              <span style={{ fontSize: 15 }}>
                {WEEKDAY_LONG[weekday]}
                {date === now ? <span className="mealday__today"> · today</span> : null}
              </span>
              <span className={`mealday__tag ${training ? 'mealday__tag--training' : ''}`}>
                {training ? 'Training day' : 'Rest day'}
              </span>
            </div>
            {meals.map((m) => {
              const logged = isMealLogged(circuit, date, m.id);
              return (
                <div key={m.id} className="mealrow">
                  <span className="meallist__time num">{m.time}</span>
                  <button
                    type="button"
                    className="mealrow__main"
                    disabled={!m.recipeId}
                    onClick={() => m.recipeId && onOpenRecipe(m.recipeId)}
                  >
                    <span className={`mealrow__name ${logged ? 'meallist__name--done' : ''}`}>
                      {m.name}
                    </span>
                    <span className="num tiny dim">
                      {m.kcal} kcal &middot; {m.protein} g protein
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={logged ? `Unlog ${m.name}` : `Log ${m.name}`}
                    aria-pressed={logged}
                    className={`meallist__tick ${logged ? 'meallist__tick--on' : ''}`}
                    onClick={() => circuit.toggleMeal(date, m.id)}
                  >
                    <Icon name="check" size={14} />
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}

      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginTop: 26 }}
        onClick={onViewShopping}
      >
        Shopping list
        <Icon name="chevron" size={15} />
      </button>
    </div>
  );
}
