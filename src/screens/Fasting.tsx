import { Icon } from '../components/Icon';
import { fastingRatio } from '../domain/nutrition';
import { formatTime } from '../lib/date';
import { useCircuitStore } from '../store/useCircuitStore';

export function Fasting({ onBack }: { onBack: () => void }) {
  const circuit = useCircuitStore();
  const { eatFrom, eatUntil } = circuit.fasting;

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Plan
      </button>

      <header className="screen-head" style={{ marginTop: 24 }}>
        <div>
          <div className="screen-head__eyebrow">Fasting window</div>
          <h1 className="num">{fastingRatio(circuit)}</h1>
        </div>
      </header>

      <p className="small muted" style={{ maxWidth: '36ch' }}>
        Eating runs {formatTime(eatFrom)} to {formatTime(eatUntil)}. The clock on Today is derived
        from these two times — it keeps running whether or not the app is open.
      </p>

      <div className="label" style={{ marginTop: 30, marginBottom: 10 }}>
        Eating opens
      </div>
      <input
        type="time"
        className="input"
        value={eatFrom}
        aria-label="Eating window opens"
        onChange={(e) => circuit.setFasting({ eatFrom: e.target.value })}
      />

      <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>
        Eating closes
      </div>
      <input
        type="time"
        className="input"
        value={eatUntil}
        aria-label="Eating window closes"
        onChange={(e) => circuit.setFasting({ eatUntil: e.target.value })}
      />

      <p className="tiny dim" style={{ marginTop: 26, lineHeight: 1.6, maxWidth: '38ch' }}>
        Fasting here is a schedule, nothing more. It is a way to bound when you eat — it is not
        required for fat loss, and hitting any particular metabolic state is not the goal. Total
        protein and total calories over the week do the work.
      </p>
    </div>
  );
}
