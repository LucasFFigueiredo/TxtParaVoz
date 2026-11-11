import { useEffect, useRef, useState } from "react";
import DropZone, { type Entrada } from "./components/DropZone";
import VoicePicker from "./components/VoicePicker";
import SpeedPicker from "./components/SpeedPicker";
import History, { type Resultado } from "./components/History";
import { getVoices, previewUrl, ttsLongo, type Voz } from "./lib/api";
import { chunkText, estimarDuracao } from "./lib/chunk";

type Aba = "arquivo" | "colar";

export default function App() {
  const [vozes, setVozes] = useState<Voz[]>([]);
  const [voz, setVoz] = useState("francisca");
  const [velocidade, setVelocidade] = useState(1);
  const [aba, setAba] = useState<Aba>("arquivo");
  const [fila, setFila] = useState<Entrada[]>([]);
  const [colado, setColado] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<{ atual: string; feitos: number; total: number } | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);
  const [carregandoPreview, setCarregandoPreview] = useState<string | null>(null);

  const audioPreview = useRef<HTMLAudioElement | null>(null);
  const abortar = useRef<AbortController | null>(null);

  useEffect(() => {
    getVoices().then(setVozes).catch(() => setErro("Não consegui falar com a API. Ela está rodando?"));
  }, []);

  function tocarPreview(apelido: string) {
    setVoz(apelido);
    const a = audioPreview.current ?? (audioPreview.current = new Audio());
    if (tocando === apelido) {
      a.pause();
      setTocando(null);
      return;
    }
    a.pause();
    setTocando(null);
    setCarregandoPreview(apelido);
    a.src = previewUrl(apelido, velocidade);
    a.onplaying = () => {
      setCarregandoPreview(null);
      setTocando(apelido);
    };
    a.onended = () => setTocando(null);
    a.onerror = () => {
      setCarregandoPreview(null);
      setErro("Não foi possível tocar a amostra da voz.");
    };
    a.play().catch(() => setCarregandoPreview(null));
  }

  const entradas: Entrada[] =
    aba === "arquivo" ? fila : colado.trim() ? [{ id: "colado", nome: "texto-colado", texto: colado }] : [];
  const totalChars = entradas.reduce((s, e) => s + e.texto.length, 0);
  const gerando = progresso !== null;
  const nomeVoz = vozes.find((v) => v.apelido === voz)?.nome ?? voz;

  async function gerar() {
    setErro(null);
    const ctrl = new AbortController();
    abortar.current = ctrl;
    try {
      for (const e of entradas) {
        const blocos = chunkText(e.texto);
        setProgresso({ atual: e.nome, feitos: 0, total: blocos.length });
        const blob = await ttsLongo(
          blocos,
          voz,
          velocidade,
          (feitos) => setProgresso({ atual: e.nome, feitos, total: blocos.length }),
          ctrl.signal
        );
        const r: Resultado = {
          id: crypto.randomUUID(),
          nome: e.nome,
          url: URL.createObjectURL(blob),
          tamanho: blob.size,
          voz: nomeVoz,
          velocidade,
        };
        setResultados((rs) => [r, ...rs]);
        if (aba === "arquivo") setFila((f) => f.filter((x) => x.id !== e.id));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setErro((err as Error).message);
    } finally {
      setProgresso(null);
      abortar.current = null;
    }
  }

  function remover(id: string) {
    setResultados((rs) => {
      const r = rs.find((x) => x.id === id);
      if (r) URL.revokeObjectURL(r.url);
      return rs.filter((x) => x.id !== id);
    });
  }

  return (
    <>
      <header className="topo">
        <div className="marca">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
          </svg>
          <span>TxtParaVoz</span>
        </div>
        <p>Transforme seus textos em áudio MP3</p>
      </header>

      <main className="grade">
        <section className="card">
          <h2>
            <span className="passo">1</span> Seu texto
          </h2>
          <div className="abas" role="tablist">
            <button role="tab" aria-selected={aba === "arquivo"} className={aba === "arquivo" ? "ativo" : ""} onClick={() => setAba("arquivo")}>
              Arquivo .txt
            </button>
            <button role="tab" aria-selected={aba === "colar"} className={aba === "colar" ? "ativo" : ""} onClick={() => setAba("colar")}>
              Colar texto
            </button>
          </div>

          {aba === "arquivo" ? (
            <>
              <DropZone onArquivos={(es) => setFila((f) => [...f, ...es])} onErro={setErro} />
              {fila.length > 0 && (
                <ul className="fila">
                  {fila.map((e) => (
                    <li key={e.id}>
                      <span className="arquivo-nome">{e.nome}.txt</span>
                      <small>
                        {e.texto.length.toLocaleString("pt-BR")} caracteres · ~{estimarDuracao(e.texto.length, velocidade)}
                      </small>
                      <button className="icone" disabled={gerando} onClick={() => setFila((f) => f.filter((x) => x.id !== e.id))} aria-label="Remover">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <textarea value={colado} onChange={(e) => setColado(e.target.value)} placeholder="Cole ou digite o texto aqui..." rows={9} />
              <small className="dica">
                {colado.length.toLocaleString("pt-BR")} caracteres{colado.trim() && ` · ~${estimarDuracao(colado.length, velocidade)}`}
              </small>
            </>
          )}
        </section>

        <section className="card">
          <h2>
            <span className="passo">2</span> Voz e velocidade
          </h2>
          <p className="dica">Clique numa voz para ouvir uma amostra.</p>
          <VoicePicker vozes={vozes} selecionada={voz} tocando={tocando} carregando={carregandoPreview} onClick={tocarPreview} />
          <h3>Velocidade</h3>
          <SpeedPicker valor={velocidade} onChange={setVelocidade} />

          <div className="acao">
            {gerando ? (
              <>
                <div className="progresso" aria-live="polite">
                  <div className="barra">
                    <div style={{ width: `${(progresso!.feitos / progresso!.total) * 100}%` }} />
                  </div>
                  <small>
                    Gerando <strong>{progresso!.atual}</strong> · parte {progresso!.feitos} de {progresso!.total}
                  </small>
                </div>
                <button className="btn secundario" onClick={() => abortar.current?.abort()}>
                  Cancelar
                </button>
              </>
            ) : (
              <button className="btn primario grande" disabled={!entradas.length || !vozes.length} onClick={gerar}>
                Gerar áudio{entradas.length > 1 ? ` (${entradas.length} arquivos)` : ""}
                {totalChars > 0 && <small> · ~{estimarDuracao(totalChars, velocidade)}</small>}
              </button>
            )}
          </div>
          {erro && (
            <div className="erro" role="alert">
              {erro}
              <button className="icone" onClick={() => setErro(null)} aria-label="Fechar">
                ×
              </button>
            </div>
          )}
        </section>

        <section className="card largo">
          <h2>
            <span className="passo">3</span> Seus áudios
          </h2>
          <History itens={resultados} onRemover={remover} />
        </section>
      </main>
    </>
  );
}
