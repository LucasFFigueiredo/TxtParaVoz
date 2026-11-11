const OPCOES = [0.75, 1, 1.25, 1.5, 2];

type Props = { valor: number; onChange: (v: number) => void };

export default function SpeedPicker({ valor, onChange }: Props) {
  return (
    <div className="velocidade">
      <div className="chips" role="radiogroup" aria-label="Velocidade">
        {OPCOES.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={valor === o}
            className={`chip ${valor === o ? "ativo" : ""}`}
            onClick={() => onChange(o)}
          >
            {o % 1 ? String(o) : o.toFixed(1)}x
          </button>
        ))}
      </div>
      <label className="slider">
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.05}
          value={valor}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output>{valor.toFixed(2)}x</output>
      </label>
    </div>
  );
}
