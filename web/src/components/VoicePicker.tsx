import type { Voz } from "../lib/api";

type Props = {
  vozes: Voz[];
  selecionada: string;
  tocando: string | null;
  carregando: string | null;
  onClick: (apelido: string) => void;
};

const BANDEIRA: Record<string, string> = { "pt-BR": "Brasil", "pt-PT": "Portugal" };

export default function VoicePicker({ vozes, selecionada, tocando, carregando, onClick }: Props) {
  return (
    <div className="vozes">
      {vozes.map((v) => {
        const ativo = v.apelido === selecionada;
        const estado = carregando === v.apelido ? "carregando" : tocando === v.apelido ? "tocando" : "";
        return (
          <button
            key={v.apelido}
            className={`voz ${ativo ? "ativo" : ""} ${estado}`}
            onClick={() => onClick(v.apelido)}
            aria-pressed={ativo}
            title={`Ouvir ${v.nome}`}
          >
            <span className={`avatar ${v.genero === "F" ? "f" : "m"}`}>{v.nome[0]}</span>
            <span className="voz-info">
              <strong>{v.nome}</strong>
              <small>
                {v.genero === "F" ? "Feminina" : "Masculina"} · {BANDEIRA[v.locale] ?? v.locale}
              </small>
            </span>
            <span className="voz-icone" aria-hidden>
              {estado === "carregando" ? <span className="spinner" /> : estado === "tocando" ? <Ondas /> : <Play />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const Play = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const Ondas = () => (
  <span className="ondas">
    <i />
    <i />
    <i />
  </span>
);
