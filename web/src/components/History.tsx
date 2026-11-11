export type Resultado = {
  id: string;
  nome: string;
  url: string;
  tamanho: number;
  voz: string;
  velocidade: number;
};

type Props = { itens: Resultado[]; onRemover: (id: string) => void };

export default function History({ itens, onRemover }: Props) {
  if (!itens.length)
    return <p className="vazio">Os áudios gerados aparecem aqui para ouvir e baixar.</p>;
  return (
    <ul className="historico">
      {itens.map((r) => (
        <li key={r.id} className="resultado">
          <div className="resultado-topo">
            <div>
              <strong>{r.nome}.mp3</strong>
              <small>
                {r.voz} · {r.velocidade}x · {(r.tamanho / 1024 / 1024).toFixed(1)} MB
              </small>
            </div>
            <button className="icone" onClick={() => onRemover(r.id)} title="Remover" aria-label="Remover">
              ×
            </button>
          </div>
          <audio controls src={r.url} preload="metadata" />
          <a className="btn primario" href={r.url} download={`${r.nome}.mp3`}>
            Baixar .mp3
          </a>
        </li>
      ))}
    </ul>
  );
}
