import { Icon } from '../components/Icon';
import { CIRCUIT_EXERCISES, BANDS } from '../data/circuitExercises';
import { MUSCLE_LABEL } from '../data/exercises';
import { loadFor, useCircuitStore } from '../store/useCircuitStore';

export function Library({ onBack }: { onBack: () => void }) {
  const circuit = useCircuitStore();
  const exercises = Object.values(CIRCUIT_EXERCISES);

  return (
    <div className="screen">
      <button type="button" className="circuit__back" onClick={onBack}>
        <Icon name="back" size={15} /> Plan
      </button>

      <header className="screen-head" style={{ marginTop: 24 }}>
        <div>
          <div className="screen-head__eyebrow">Exercise library</div>
          <h1>Movements</h1>
        </div>
      </header>

      <p className="small muted" style={{ maxWidth: '36ch' }}>
        Everything the plan can draw on, with the load you last worked at. Adjust weights inside a
        workout — they carry over on their own.
      </p>

      <div className="libolist">
        {exercises.map((ex) => {
          const load = loadFor(circuit, ex.id);
          return (
            <div key={ex.id} className="libo">
              <div className="libo__head">
                <span className="libo__name">{ex.name}</span>
                <span className="num tiny dim">
                  {ex.kind === 'time'
                    ? ex.prescription
                    : load.kind === 'band'
                      ? `${BANDS[load.bandIndex]} band`
                      : `${load.weight} ${ex.unit}`}
                </span>
              </div>
              <div className="libo__meta">
                <span className="num">{ex.line}</span>
                <span>{ex.muscles.map((m) => MUSCLE_LABEL[m]).join(' · ')}</span>
              </div>
              <p className="libo__cue">{ex.cue}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
