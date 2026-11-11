import { useRef, useState } from "react";

export type Entrada = { id: string; nome: string; texto: string };

type Props = { onArquivos: (e: Entrada[]) => void; onErro: (msg: string) => void };

export default function DropZone({ onArquivos, onErro }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  async function ler(files: FileList | null) {
    if (!files?.length) return;
    const validos = [...files].filter((f) => f.name.toLowerCase().endsWith(".txt"));
    if (validos.length < files.length) onErro("Só arquivos .txt são aceitos; os outros foram ignorados.");
    const entradas = await Promise.all(
      validos.map(async (f) => ({ id: crypto.randomUUID(), nome: f.name.replace(/\.txt$/i, ""), texto: await f.text() }))
    );
    const vazios = entradas.filter((e) => !e.texto.trim());
    if (vazios.length) onErro(`Arquivo vazio: ${vazios.map((v) => v.nome).join(", ")}`);
    onArquivos(entradas.filter((e) => e.texto.trim()));
  }

  return (
    <div
      className={`dropzone ${arrastando ? "ativo" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        ler(e.dataTransfer.files);
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
      </svg>
      <strong>Arraste seus arquivos .txt aqui</strong>
      <span>ou clique para escolher</span>
      <input
        ref={input}
        type="file"
        accept=".txt,text/plain"
        multiple
        hidden
        onChange={(e) => {
          ler(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
