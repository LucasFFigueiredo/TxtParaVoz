# TxtParaVoz

Converte arquivos `.txt` em áudio `.mp3` com vozes neurais em português (edge-tts). Tem interface web e linha de comando.

## Estrutura

```
txtparavoz/   motor de síntese (core, engines, cli)
api/          API FastAPI (/api/voices, /api/tts, /api/preview) — vira função Python na Vercel
web/          interface React + Vite + TypeScript
voz.py        atalho para o CLI
vercel.json   configuração de deploy
```

## Rodar localmente

```bash
pip install -r requirements.txt
npm install --prefix web

python -m uvicorn api.index:app --reload --port 8000   # terminal 1
npm --prefix web run dev                               # terminal 2 → http://localhost:5173
```

## Linha de comando

```bash
python voz.py arquivo.txt --voz antonio --velocidade 1.5
python voz.py --all --saida saida/ --legenda
python voz.py --listar-vozes
```

Vozes: `francisca`, `antonio`, `thalita` (pt-BR), `raquel`, `duarte` (pt-PT).
Opções: `--velocidade`, `--tom`, `--volume`, `-o`, `--saida`, `--force`, `--legenda` (.srt), `--engine edge|gtts`.

## Como a web lida com textos longos

O front divide o texto em blocos de ~900 caracteres, gera até 5 em paralelo via `/api/tts` e junta os MP3 no navegador. Assim cada requisição fica bem abaixo do limite de tempo das funções da Vercel.
