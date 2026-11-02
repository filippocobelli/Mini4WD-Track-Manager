# Mini4WD Track Planner

Progetta piste Mini4WD a 2 corsie compatibili Tamiya, fatte con pezzi stampati in 3D
(set [MINI4WD 2 LANE DIY TRACK](https://makerworld.com/en/models/542904-2-lane-mini-4wd-track) e modelli collegati).

Pianta 2D e vista 3D, verifica di chiusura, distinta pezzi e ore di stampa, magazzino con storico,
generatore di tracciati in base allo spazio o ai pezzi che hai.

## Download

Ogni versione è nella pagina **Releases** del repository:

| File | Per |
|---|---|
| `Mini4WD-Track-Planner-<versione>-mac-universal.dmg` | macOS (Intel e Apple Silicon) |
| `Mini4WD-Track-Planner-<versione>-win-setup.exe` | Windows, con installazione |
| `Mini4WD-Track-Planner-<versione>-win-portable.exe` | Windows, senza installazione |
| `Mini4WD-Track-Planner-v<versione>.html` | Browser o sito statico (es. html.cobelli.uk) |

Le app non sono firmate:
- **macOS**: al primo avvio, tasto destro sull'app → *Apri*. Se macOS la blocca: *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*.
- **Windows**: se compare SmartScreen, *Ulteriori informazioni → Esegui comunque*.

I dati (circuito, magazzino, storico) restano sul dispositivo. Per spostarli usa *Circuiti → Copia JSON* e *Carica JSON*.

## Struttura

```
app/                 sorgente unico (index.html, icone, manifest)
electron/main.js     finestra dell'app desktop
scripts/build.mjs    genera dist/web/*.html (file unico) e desktop/ (versione offline)
build/icon.png       icona delle app desktop
.github/workflows/   build e release automatiche
```

## Sviluppo

```bash
npm install
npm start            # apre l'app desktop
npm run build:web    # crea il file HTML unico in dist/web/
```

## Pubblicare una nuova versione

Ogni build ha un numero di versione. Per rilasciare:

1. Aggiungi la sezione della nuova versione in `CHANGELOG.md`.
2. `npm version patch` (oppure `minor` / `major`): aggiorna `package.json` e `app/index.html`, crea commit e tag.
3. `git push --follow-tags`

GitHub Actions costruisce `.dmg` ed `.exe` e crea la Release con anche il file HTML.
Il workflow si ferma se tag, `package.json`, `app/index.html` e `CHANGELOG.md` non hanno la stessa versione.
