import argparse
import asyncio
import sys
from pathlib import Path

from .core import VOZES, VOZ_PADRAO, synthesize_file
from .engines import EdgeEngine


def main(argv=None):
    p = argparse.ArgumentParser(prog="voz", description="Converte arquivos .txt em MP3.")
    p.add_argument("arquivos", nargs="*", help="arquivos .txt")
    p.add_argument("--all", action="store_true", help="todos os .txt da pasta atual")
    p.add_argument("--force", action="store_true", help="refaz mesmo se o .mp3 já existir")
    p.add_argument("--voz", default=VOZ_PADRAO, help=f"apelido ({', '.join(VOZES)}) ou ID")
    p.add_argument("--velocidade", type=float, default=1.0, help="ex.: 1.0, 1.25, 1.5, 2.0")
    p.add_argument("--tom", type=int, default=0, help="ajuste de tom em Hz (ex.: -20, +10)")
    p.add_argument("--volume", type=float, default=1.0, help="ex.: 0.8, 1.0, 1.5")
    p.add_argument("--saida", help="pasta de saída")
    p.add_argument("-o", dest="nome", help="nome do mp3 (só com 1 arquivo)")
    p.add_argument("--engine", choices=["edge", "gtts"], default="edge")
    p.add_argument("--legenda", action="store_true", help="gera também um .srt")
    p.add_argument("--listar-vozes", action="store_true")
    a = p.parse_args(argv)

    if a.listar_vozes:
        print("Apelidos:", ", ".join(f"{k} ({v})" for k, v in VOZES.items()), "\n")
        for v in asyncio.run(EdgeEngine.listar("pt")):
            print(f"  {v['ShortName']:40} {v['Gender']}")
        return 0

    arquivos = [Path(x) for x in a.arquivos]
    if a.all:
        arquivos += sorted(Path(".").glob("*.txt"))
    if not arquivos:
        p.error("informe arquivos .txt ou use --all")
    if a.nome and len(arquivos) > 1:
        p.error("-o só funciona com um arquivo")

    erros = 0
    for arq in arquivos:
        destino = Path(a.nome) if a.nome else arq.with_suffix(".mp3").name
        destino = Path(a.saida) / destino if a.saida else (Path(destino) if a.nome else arq.with_suffix(".mp3"))
        if destino.exists() and a.all and not a.force:
            print(f"Pulando {arq} (já existe {destino}; use --force)")
            continue
        print(f"Gerando {destino} a partir de {arq} [{a.voz}, {a.velocidade}x]")
        try:
            synthesize_file(arq, destino, voz=a.voz, velocidade=a.velocidade, tom=a.tom,
                            volume=a.volume, engine=a.engine, legenda=a.legenda)
            print(f"OK: {destino}")
        except Exception as e:
            erros += 1
            print(f"\nErro em {arq}: {e}", file=sys.stderr)
    return 1 if erros else 0
