import { Icon } from '../components/Icon';
import { SHOPPING_LIST } from '../data/nutrition';
import { formatShort, startOfWeek, today as todayISO } from '../lib/date';
import { useCircuitStore } from '../store/useCircuitStore';

export function Shopping({ onBack }: { onBack: () => void }) {
  const circuit = useCircuitStore();
  const weekStart = startOfWeek(todayISO());

  const total = SHOPPING_LIST.reduce((n, g) => n + g.items.length, 0);
  const done = SHOPPING_LIST.reduce(
    (n, g) => n + g.items.filter((i) => circuit.bought[`${g.title}/${i.name}`]).length,
    0,
  );

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Meal plan
      </button>

      <header className="screen-head" style={{ marginTop: 24 }}>
        <div>
          <div className="screen-head__eyebrow">Shopping list</div>
          <h1>Week of {formatShort(weekStart)}</h1>
        </div>
      </header>

      <div className="tiny dim">
        Built from the plan. <span className="num">{done}</span> of{' '}
        <span className="num">{total}</span> in the basket.
      </div>

      {SHOPPING_LIST.map((group) => (
        <section key={group.title} className="shopgroup">
          <div className="shopgroup__head">{group.title}</div>
          {group.items.map((item) => {
            const on = !!circuit.bought[`${group.title}/${item.name}`];
            return (
              <button
                key={item.name}
                type="button"
                className="shoprow"
                aria-pressed={on}
                onClick={() => circuit.toggleBought(group.title, item.name)}
              >
                <span className={`shoprow__box ${on ? 'shoprow__box--on' : ''}`}>
                  <Icon name="check" size={13} />
                </span>
                <span className={`shoprow__name ${on ? 'shoprow__name--on' : ''}`}>{item.name}</span>
                <span className="num tiny dim">{item.qty}</span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}
