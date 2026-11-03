# Mini4WD Track Planner

Progetta piste **Mini4WD a 2 corsie** compatibili Tamiya fatte con pezzi stampati in 3D, sai subito
quanti pezzi servono, quali hai già e quanto tempo di stampa manca.

![Pianta del circuito](docs/screenshots/01-pianta.png)

**[⬇ Scarica l'ultima versione](https://github.com/filippocobelli/Mini4WD-Track-Manager/releases/latest)** · macOS (.dmg) · Windows (.exe) · HTML

---

## Perché esiste

Le piste ufficiali Tamiya in Europa sono difficili da trovare e costose da spedire. Per questo esistono
set di pezzi da stampare in 3D, come
[MINI4WD 2 LANE DIY TRACK](https://makerworld.com/en/models/542904-2-lane-mini-4wd-track):
rettilinei, curve da 45°, cambio corsia e clip.

Con i pezzi stampati però le domande diventano altre:

- che circuito posso montare con i pezzi che ho già?
- se ho 3 metri × 2 in garage, che piste ci stanno?
- quanti pezzi devo ancora stampare, e quante ore di stampante sono?
- se aggiungo un salto o una curva sopraelevata, il circuito si chiude ancora?

Track Planner risponde a queste domande prima di accendere la stampante.

## Cosa fa

| | |
|---|---|
| **Pianta 2D** | Componi il circuito pezzo per pezzo, verifica che si chiuda, vedi ingombro e lunghezza del giro. |
| **Vista 3D** | Ruota il circuito con pareti, cambio corsia sopraelevato, rampe e supporti. |
| **Distinta pezzi** | Pezzi necessari, già in magazzino e da stampare, con ore di stampa e numero di clip. |
| **Magazzino** | Inventario dei pezzi stampati con storico di ogni movimento. |
| **Idee** | Tracciati proposti in base allo spazio libero o ai pezzi che hai, anche in modo casuale con opzioni (salto, scambio, velocità, pista jump…). |
| **Modelli** | Altri elementi compatibili trovati su MakerWorld, con link e misure. |

---

## Le sezioni

### Pianta e riepilogo

La barra in basso contiene i pezzi: rettilinei 200 / 215 / 100 mm, curve da 45° a sinistra e a destra,
cambio corsia, più gli **elementi extra**. Il triangolo giallo indica dove verrà agganciato il prossimo pezzo.
Tocca un pezzo della pista per selezionarlo: i nuovi pezzi vengono inseriti subito dopo.

Il **Riepilogo** controlla in continuazione:

- **chiusura**: errore in mm e angolo; se il circuito è aperto propone quali rettilinei aggiungere;
- **lunghezza delle corsie**: con un numero dispari di cambi corsia le due auto fanno la stessa distanza in 2 giri;
- **ingombro** in cm e se entra nello spazio indicato;
- **altezze**: dislivello da recuperare, quota massima e supporti necessari.

Rosso e blu in pianta seguono il percorso delle due auto nel primo giro.

### Vista 3D

![Vista 3D](docs/screenshots/08-vista-3d.png)

Pulsante **3D** in alto a destra. Trascina per ruotare, rotella o due dita per lo zoom.
Si vedono il ponte del cambio corsia, le parti sollevate, i supporti sotto e i salti.

### Pezzi (distinta)

![Distinta pezzi](docs/screenshots/02-pezzi.png)

Per ogni parte stampata: quante ne servono, quante ne hai in magazzino, quante da stampare e le ore.
Conta anche le **clip** (2 per giunto, modificabile) e i **supporti** per i tratti rialzati.
Il pulsante **Ho stampato i mancanti** aggiorna il magazzino in un clic.

### Magazzino

![Magazzino e storico](docs/screenshots/03-magazzino.png)

Il magazzino è l'elenco dei pezzi che hai già stampato.

- Aggiungi o togli pezzi con **+** e **−**, o scrivi direttamente la quantità.
- **+ 1 kit base completo** carica in un colpo tutti i pezzi del set (8 curve, 2+2+2 rettilinei, cambio corsia).
- Ogni modifica finisce nello **storico** con data, quantità e motivo (kit, stampati per un circuito, modifica manuale…).
  Così sai cosa hai stampato e quando, e cosa si è rotto.

Il magazzino è usato dalla distinta (colonna *In magazzino*) e da tutti i generatori di tracciati.

### Idee: tracciati generati

![Circuito casuale](docs/screenshots/04-idee-casuale.png)

Inserisci **larghezza e profondità** dello spazio libero, poi scegli da cosa partire:

| Parti da | Cosa ottieni |
|---|---|
| **Spazio disponibile** | circuiti che entrano nello spazio; possono richiedere pezzi da stampare |
| **Solo pezzi in magazzino** | circuiti montabili subito, senza stampare nulla |
| **Pezzi in magazzino + spazio** | entrambe le condizioni |

Poi attiva cosa vuoi nel circuito:

| Opzione | Effetto |
|---|---|
| **Scambio corsia** | inserisce il cambio corsia, per gare alla pari |
| **Un salto** | un rettilineo Jump |
| **Pista jump** | salti, sella e dosso |
| **Velocità** | lati lunghi e poche curve |
| **Tecnica** | chicane, fagioli, piste a L, tante curve |
| **Sopraelevata** | una curva a 180° rialzata con le rampe rainbow |
| **Spirale** | una salita e una discesa a spirale |
| **Compatta** | il minor ingombro possibile |

**🎲 Genera 3 circuiti** propone ogni volta tre tracciati diversi (ovale, rettangolo, ottagono, ovale con chicane,
fagiolo, pista a L). Ogni proposta è verificata: si chiude, torna alla quota di partenza ed entra nello spazio.
Per ognuna vedi anteprima, ingombro, giro, **pezzi che hai** e **pezzi da stampare** con le ore stimate.
**Usa questo tracciato** lo apre nella pianta per modificarlo.

![Alternative ordinate](docs/screenshots/05-idee-alternative.png)

**Alternative ordinate** fa la stessa ricerca in modo sistematico: per ovali, rettangoli e ottagoni mostra
il più economico (pochi pezzi da stampare), il più lungo con poche stampe e il più lungo che ci sta.

### Modelli ed elementi extra

![Modelli MakerWorld](docs/screenshots/06-modelli.png)

Oltre al kit base, il planner conosce questi elementi compatibili con la pista Tamiya a 2 corsie:

| Elemento | Modello | Note |
|---|---|---|
| Rettilineo 200 / 215 / 100, curva 45°, cambio corsia | [2 LANE MINI 4WD TRACK](https://makerworld.com/en/models/542904-2-lane-mini-4wd-track) – Pat | kit base |
| Salto 200 mm | [Jump](https://makerworld.com/en/models/1373681-2-lane-mini-4wd-track-jump) – Jangyy | ~7 h di stampa |
| Spirale | [Spiral Track element](https://makerworld.com/en/models/1395843-spiral-track-element-for-2-lane-mini-4wd-track) – Jangyy | misure da verificare |
| Wall | [Wall Track element](https://makerworld.com/en/models/1418601-wall-track-element-for-2-lane-mini-4wd-track) – Jangyy | misure da verificare |
| Dosso | 2 LANE MINI 4WD TRACK Ramp/Hill – Jangyy | misure da verificare |
| Rampa rainbow | [Tamiya rainbow track 2 lane](https://makerworld.com/en/models/1336265-tamiya-rainbow-track-2-lane-no-change-lane) – Sunza83 | rampe e supporti |
| Sella | [Mini 4WD Track Saddle](https://makerworld.com/en/models/734281-mini-4wd-track-saddle) | 4,6 h di stampa |
| Rettilineo modulare 240 | [Modular Mini4wd 240mm track set](https://makerworld.com/en/models/248350-modular-mini4wd-240mm-track-set-1) – rucdoc | per stampanti piccole |
| Curve di altri raggi | [Single Lane Curve pack](https://makerworld.com/en/models/1132759-mini4wd-single-lane-curve-track-pack) – rucdoc | da aggiungere come pezzo personalizzato |

L'app contiene solo i link: i file STL si scaricano da MakerWorld, con le licenze dei rispettivi autori.

### Catalogo

![Catalogo](docs/screenshots/07-catalogo.png)

Tutte le misure sono modificabili: larghezza pista, raggio delle curve, lunghezza del cambio corsia,
dislivello delle rampe, quantità nel kit e ore di stampa per pezzo. Puoi aggiungere **pezzi personalizzati**
(rettilinei o curve di qualsiasi angolo e raggio) che compaiono nella barra come gruppo *Miei*.

> Il raggio delle curve (480 mm in asse) e la lunghezza del cambio corsia (830 mm) sono stimati dall'ovale
> Tamiya 216 × 120 cm. Misurali sui tuoi pezzi e correggili qui: tutti i calcoli si aggiornano.

### Circuiti

Circuiti pronti (ovale del kit, ovale lungo, rettangolo, ovale con salto e sella, ovale con rainbow),
esportazione e importazione in JSON (circuito + magazzino + storico) e copia della pianta in SVG.

### Da telefono

<img src="docs/screenshots/09-mobile.png" width="300" alt="Versione mobile">

La versione HTML funziona anche su telefono: pianta con pan e zoom a due dita, barra pezzi scorrevole.

---

## Download e installazione

Ogni versione è nella pagina **[Releases](https://github.com/filippocobelli/Mini4WD-Track-Manager/releases)**:

| File | Per |
|---|---|
| `Mini4WD-Track-Planner-<versione>-mac-universal.dmg` | macOS (Intel e Apple Silicon) |
| `Mini4WD-Track-Planner-<versione>-win-setup.exe` | Windows, con installazione |
| `Mini4WD-Track-Planner-<versione>-win-portable.exe` | Windows, senza installazione |
| `Mini4WD-Track-Planner-v<versione>.html` | qualsiasi browser o sito statico |

Versione web sempre aggiornata: **[lab.cobelli.uk/Mini4WD-Track-Manager](https://lab.cobelli.uk/Mini4WD-Track-Manager/)**.

Le app desktop funzionano offline. Non hanno la firma a pagamento di Apple e Microsoft:
- **macOS**: al primo avvio, tasto destro sull'app → *Apri*. Se macOS la blocca: *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*.
  Se compare «è danneggiata e non può essere aperta», apri il Terminale e scrivi
  `xattr -cr "/Applications/Mini4WD Track Planner.app"`, poi riaprila.
- **Windows**: se compare SmartScreen, *Ulteriori informazioni → Esegui comunque*.

I dati (circuito, magazzino, storico) restano sul dispositivo. Per spostarli: *Circuiti → Copia JSON* e *Carica JSON*.

---

## Sviluppo

```
app/                 sorgente unico (index.html, icone, manifest)
electron/main.js     finestra dell'app desktop
scripts/build.mjs    genera dist/web/*.html (file unico) e desktop/ (versione offline)
build/icon.png       icona delle app desktop
docs/screenshots/    immagini di questo README
.github/workflows/   build e release automatiche
```

```bash
npm install
npm start            # apre l'app desktop
npm run build:web    # crea il file HTML unico in dist/web/
```

### Versioni e release

Ogni build ha un numero di versione `MAJOR.MINOR.PATCH`, visibile accanto al titolo dell'app.

1. Aggiungi la sezione della nuova versione in `CHANGELOG.md`.
2. `npm version patch` (oppure `minor` / `major`): aggiorna `package.json` e `app/index.html` e crea il commit.
3. `git push`

Quando su `main` arriva una versione non ancora rilasciata, GitHub Actions costruisce `.dmg` ed `.exe`,
crea il tag `vX.Y.Z` e la Release con anche il file HTML. Il workflow si ferma se `package.json`,
`app/index.html` e `CHANGELOG.md` non hanno la stessa versione.
