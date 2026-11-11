"""API web do TxtParaVoz (FastAPI). Local: uvicorn api.index:app --reload --port 8000"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # acha o pacote txtparavoz

from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.responses import Response  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from txtparavoz.core import VOZES_INFO, frase_apresentacao, synthesize_bytes  # noqa: E402

MAX_CHARS = 2000  # o front manda blocos de ~900; mais que isso estoura o tempo na Vercel

app = FastAPI(title="TxtParaVoz")
_preview_cache: dict[tuple[str, float], bytes] = {}


class TTSIn(BaseModel):
    texto: str = Field(..., min_length=1)
    voz: str = "francisca"
    velocidade: float = Field(1.0, ge=0.5, le=2.5)


def _checar_voz(voz: str) -> str:
    voz = voz.lower()
    if voz not in VOZES_INFO:
        raise HTTPException(400, f"Voz desconhecida: {voz}")
    return voz


@app.get("/api/voices")
def voices():
    return [{"apelido": k, **v} for k, v in VOZES_INFO.items()]


@app.post("/api/tts")
async def tts(body: TTSIn):
    voz = _checar_voz(body.voz)
    if len(body.texto) > MAX_CHARS:
        raise HTTPException(413, f"Bloco grande demais (máx. {MAX_CHARS} caracteres).")
    try:
        audio = await synthesize_bytes(body.texto, voz, body.velocidade)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"Falha ao gerar áudio: {e}")
    return Response(audio, media_type="audio/mpeg")


@app.get("/api/preview")
async def preview(voz: str = Query("francisca"), velocidade: float = Query(1.0, ge=0.5, le=2.5)):
    voz = _checar_voz(voz)
    chave = (voz, round(velocidade, 2))
    if chave not in _preview_cache:
        try:
            _preview_cache[chave] = await synthesize_bytes(frase_apresentacao(voz), voz, velocidade)
        except Exception as e:
            raise HTTPException(502, f"Falha ao gerar amostra: {e}")
    return Response(_preview_cache[chave], media_type="audio/mpeg",
                    headers={"Cache-Control": "public, max-age=86400"})
