"""API reutilizável (CLI, API web e GUI)."""
import re
from pathlib import Path

from .engines import ENGINES, EdgeEngine

# apelido -> metadados da voz (edge-tts)
VOZES_INFO = {
    "francisca": {"id": "pt-BR-FranciscaNeural", "nome": "Francisca", "genero": "F", "locale": "pt-BR"},
    "antonio": {"id": "pt-BR-AntonioNeural", "nome": "Antonio", "genero": "M", "locale": "pt-BR"},
    "thalita": {"id": "pt-BR-ThalitaMultilingualNeural", "nome": "Thalita", "genero": "F", "locale": "pt-BR"},
    "raquel": {"id": "pt-PT-RaquelNeural", "nome": "Raquel", "genero": "F", "locale": "pt-PT"},
    "duarte": {"id": "pt-PT-DuarteNeural", "nome": "Duarte", "genero": "M", "locale": "pt-PT"},
}
VOZES = {k: v["id"] for k, v in VOZES_INFO.items()}
VOZ_PADRAO = "francisca"


def resolver_voz(voz: str) -> str:
    return VOZES.get(voz.lower(), voz)  # aceita apelido ou ID completo


def limpar_texto(texto: str) -> str:
    texto = re.sub(r"[#*_`>|]+", " ", texto)          # marcadores markdown
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\n\s*\n+", "\n\n", texto)
    return texto.strip()


def frase_apresentacao(apelido: str) -> str:
    info = VOZES_INFO[apelido]
    artigo = "a" if info["genero"] == "F" else "o"
    return f"Oi, tudo bem? Eu sou {artigo} {info['nome']}."


def synthesize(texto, saida, voz=VOZ_PADRAO, velocidade=1.0, tom=0, volume=1.0,
               engine="edge", legenda=False):
    texto = limpar_texto(texto)
    if not texto:
        raise ValueError("Texto vazio.")
    saida = Path(saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    srt = saida.with_suffix(".srt") if legenda else None
    ENGINES[engine]().synth(texto, str(saida), resolver_voz(voz), velocidade, tom, volume,
                            str(srt) if srt else None)
    return saida


async def synthesize_bytes(texto, voz=VOZ_PADRAO, velocidade=1.0, tom=0, volume=1.0) -> bytes:
    """Gera o MP3 em memória (usado pela API web)."""
    texto = limpar_texto(texto)
    if not texto:
        raise ValueError("Texto vazio.")
    return await EdgeEngine.to_bytes(texto, resolver_voz(voz), velocidade, tom, volume)


def synthesize_file(entrada, saida=None, **opts):
    entrada = Path(entrada)
    texto = entrada.read_text(encoding="utf-8")
    saida = Path(saida) if saida else entrada.with_suffix(".mp3")
    return synthesize(texto, saida, **opts)
