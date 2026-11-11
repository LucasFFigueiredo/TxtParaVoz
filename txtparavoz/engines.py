"""Motores de síntese. Todos expõem: synth(texto, saida_mp3, voz, rate, pitch, volume, srt=None)."""
import asyncio


def _pct(valor: float) -> str:
    """1.5 -> '+50%', 0.8 -> '-20%'."""
    p = round((valor - 1.0) * 100)
    return f"{p:+d}%"


class EdgeEngine:
    nome = "edge"

    def synth(self, texto, saida, voz, velocidade=1.0, tom=0, volume=1.0, srt=None):
        asyncio.run(self._run(texto, saida, voz, velocidade, tom, volume, srt))

    async def _run(self, texto, saida, voz, velocidade, tom, volume, srt):
        import edge_tts

        com = edge_tts.Communicate(
            texto, voz, rate=_pct(velocidade), pitch=f"{int(tom):+d}Hz", volume=_pct(volume)
        )
        sub = edge_tts.SubMaker() if srt else None
        total = len(texto)
        feito = 0
        with open(saida, "wb") as f:
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    feito += len(chunk.get("text", ""))
                    _progresso(min(feito / max(total, 1), 1.0))
                    if sub:
                        sub.feed(chunk)
        _progresso(1.0)
        print()
        if sub:
            with open(srt, "w", encoding="utf-8") as f:
                f.write(sub.get_srt())

    @staticmethod
    async def to_bytes(texto, voz, velocidade=1.0, tom=0, volume=1.0) -> bytes:
        import edge_tts

        com = edge_tts.Communicate(
            texto, voz, rate=_pct(velocidade), pitch=f"{int(tom):+d}Hz", volume=_pct(volume)
        )
        partes = []
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                partes.append(chunk["data"])
        return b"".join(partes)

    @staticmethod
    async def listar(prefixo="pt"):
        import edge_tts

        vozes = await edge_tts.list_voices()
        return [v for v in vozes if v["Locale"].lower().startswith(prefixo.lower())]


class GttsEngine:
    nome = "gtts"

    def synth(self, texto, saida, voz=None, velocidade=1.0, tom=0, volume=1.0, srt=None):
        from gtts import gTTS

        if velocidade != 1.0 and velocidade >= 0.9:
            print("Aviso: gTTS não ajusta velocidade (só lenta < 0.9). Ignorando.")
        if srt:
            print("Aviso: gTTS não gera legenda. Ignorando --legenda.")
        gTTS(text=texto, lang="pt", tld="com.br", slow=velocidade < 0.9).save(saida)


ENGINES = {"edge": EdgeEngine, "gtts": GttsEngine}


def _progresso(frac):
    n = int(frac * 30)
    print(f"\r  [{'#' * n}{'.' * (30 - n)}] {frac * 100:5.1f}%", end="", flush=True)
