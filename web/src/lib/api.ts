export type Voz = { apelido: string; id: string; nome: string; genero: "F" | "M"; locale: string };

async function erro(r: Response): Promise<never> {
  let msg = `Erro ${r.status}`;
  try {
    const j = await r.json();
    if (j?.detail) msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
  } catch {}
  throw new Error(msg);
}

export async function getVoices(): Promise<Voz[]> {
  const r = await fetch("/api/voices");
  if (!r.ok) await erro(r);
  return r.json();
}

export function previewUrl(voz: string, velocidade: number) {
  return `/api/preview?voz=${encodeURIComponent(voz)}&velocidade=${velocidade}`;
}

export async function tts(texto: string, voz: string, velocidade: number, signal?: AbortSignal): Promise<Blob> {
  const r = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, voz, velocidade }),
    signal,
  });
  if (!r.ok) await erro(r);
  return r.blob();
}

/** Gera todos os blocos (vários em paralelo, ordem preservada) e junta num único MP3. */
export async function ttsLongo(
  blocos: string[],
  voz: string,
  velocidade: number,
  onProgress: (feitos: number) => void,
  signal?: AbortSignal,
  paralelo = 5
): Promise<Blob> {
  const saida: Blob[] = new Array(blocos.length);
  let proximo = 0;
  let feitos = 0;
  async function worker() {
    while (proximo < blocos.length) {
      const i = proximo++;
      saida[i] = await tts(blocos[i], voz, velocidade, signal);
      onProgress(++feitos);
    }
  }
  await Promise.all(Array.from({ length: Math.min(paralelo, blocos.length) }, worker));
  return new Blob(saida, { type: "audio/mpeg" });
}
