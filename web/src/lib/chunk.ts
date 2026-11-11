/** Divide o texto em blocos de até `max` caracteres, respeitando parágrafos e frases. */
// ~900 caracteres ≈ 30 s de processamento no edge-tts: cabe folgado no limite da Vercel
export function chunkText(texto: string, max = 900): string[] {
  const pedacos: string[] = [];
  for (const par of texto.split(/\n\s*\n/)) {
    const p = par.trim();
    if (!p) continue;
    if (p.length <= max) {
      pedacos.push(p);
      continue;
    }
    // parágrafo longo: quebra por frase; frase gigante: quebra por espaço
    for (const frase of p.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [p]) {
      if (frase.length <= max) pedacos.push(frase);
      else for (let i = 0; i < frase.length; i += max) pedacos.push(frase.slice(i, i + max));
    }
  }
  // junta pedaços pequenos até o limite
  const blocos: string[] = [];
  let atual = "";
  for (const p of pedacos) {
    if (atual && atual.length + p.length + 2 > max) {
      blocos.push(atual);
      atual = p;
    } else {
      atual = atual ? `${atual}\n\n${p}` : p;
    }
  }
  if (atual.trim()) blocos.push(atual);
  return blocos;
}

/** Estimativa grosseira: ~13 caracteres por segundo a 1.0x. */
export function estimarDuracao(chars: number, velocidade: number): string {
  const s = Math.round(chars / 13 / velocidade);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60}s` : `${s}s`;
}
