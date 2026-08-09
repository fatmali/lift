import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { MEAL_PLAN, getRecipe } from '../data/nutrition';
import { isMealLogged } from '../domain/nutrition';
import { today as todayISO, weekdayOf } from '../lib/date';
import { useCircuitStore } from '../store/useCircuitStore';

export function Recipe({
  recipeId,
  onBack,
  onViewShopping,
}: {
  recipeId: string;
  onBack: () => void;
  onViewShopping: () => void;
}) {
  const circuit = useCircuitStore();
  const recipe = getRecipe(recipeId);
  const [swapsOpen, setSwapsOpen] = useState(false);
  const now = todayISO();

  if (!recipe) return null;

  // Log against today's slot for this recipe, when the plan has one.
  const todaysMeal = (MEAL_PLAN[weekdayOf(now)] ?? []).find((m) => m.recipeId === recipe.id);
  const logged = todaysMeal ? isMealLogged(circuit, now, todaysMeal.id) : false;

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Meal plan
      </button>

      <h1 className="recipe__title">{recipe.name}</h1>

      <div className="recipe__stats">
        <div>
          <div className="num recipe__statval">{recipe.kcal}</div>
          <div className="circuit__statlabel">kcal</div>
        </div>
        <div>
          <div className="num recipe__statval">
            {recipe.protein}
            <span style={{ fontSize: 15 }}>g</span>
          </div>
          <div className="circuit__statlabel">protein</div>
        </div>
        <div>
          <div className="num recipe__statval">{recipe.prepMin}</div>
          <div className="circuit__statlabel">prep min</div>
        </div>
        <div>
          <div className="num recipe__statval">{recipe.cookMin}</div>
          <div className="circuit__statlabel">cook min</div>
        </div>
      </div>

      <div className="label" style={{ marginTop: 26, marginBottom: 10 }}>
        Ingredients
      </div>
      <div className="recipe__ingredients">
        {recipe.ingredients.map((ing) => (
          <span key={ing}>{ing}</span>
        ))}
      </div>

      <div className="label" style={{ marginTop: 30, marginBottom: 8 }}>
        Method
      </div>
      <ol className="recipe__method">
        {recipe.method.map((step, i) => (
          <li key={step}>
            <span className="num recipe__step">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {todaysMeal ? (
        <button
          type="button"
          className="btn btn--primary btn--block"
          style={{ marginTop: 28 }}
          onClick={() => circuit.toggleMeal(now, todaysMeal.id)}
        >
          {logged ? 'Logged today' : 'Log meal'}
          {logged ? <Icon name="check" size={17} /> : null}
        </button>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onViewShopping}>
          Add to list
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ flex: 1 }}
          disabled={!recipe.swaps.length}
          onClick={() => setSwapsOpen(true)}
        >
          Swap meal
        </button>
      </div>

      {recipe.swaps.length ? (
        <>
          <div className="label" style={{ marginTop: 32, marginBottom: 10 }}>
            Swaps that keep the numbers
          </div>
          <div className="recipe__swaps">
            {recipe.swaps.map((s) => (
              <div key={s.component} className="recipe__swaprow">
                <span className="recipe__swapfrom">{s.component}</span>
                <span className="recipe__swapto">{s.options.join(' · ')}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <Sheet open={swapsOpen} onClose={() => setSwapsOpen(false)} title="Swap an ingredient">
        <p className="muted small" style={{ marginBottom: 18 }}>
          Each option lands in a similar protein and calorie range, so the day still adds up.
        </p>
        <div className="stack">
          {recipe.swaps.map((s) => (
            <div key={s.component}>
              <div className="label" style={{ marginBottom: 8 }}>
                Instead of {s.component.toLowerCase()}
              </div>
              <div className="chiprow">
                {s.options.map((o) => (
                  <span key={o} className="chip chip--static">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
