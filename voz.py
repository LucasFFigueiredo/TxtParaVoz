"""Uso: python voz.py arquivo.txt [--voz antonio] [--velocidade 1.5]  (veja --help)"""
import sys

from txtparavoz.cli import main

if __name__ == "__main__":
    sys.exit(main())
