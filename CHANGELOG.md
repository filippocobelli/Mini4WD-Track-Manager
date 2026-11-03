# Changelog

Versioni secondo [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.
- PATCH: correzioni che non cambiano il funzionamento (es. 1.0.1)
- MINOR: nuove funzioni compatibili (es. 1.1.0)
- MAJOR: cambi che rompono i circuiti o i dati salvati (es. 2.0.0)

## [2.0.1] - 2026-11-03

- Officina nell'anteprima di claude.ai: i download passano dalla funzione di salvataggio di Claude
  (STL e OBJ consegnati dentro uno zip, che è il formato accettato lì). Web e app desktop invariati.

## [2.0.0] - 2026-11-03

**Officina: motore 3D per creare pezzi di pista da stampare.**

- Nuova scheda **Officina**: genera pezzi in STL e OBJ, con anteprima 3D. Elementi: rettilineo, curva (angolo e raggio),
  rampa, dosso, salto, sella, washboard, supporto per tratti rialzati.
- Profilo misurato sul rettilineo da 200 mm del set (corsie 115 mm, pareti e pavimento 2,5 mm, sponde 50 mm, raccordi,
  asole, alette di aggancio Tamiya): il pezzo generato coincide con l'originale. Profilo modificabile.
- Piatto della stampante selezionabile: i pezzi troppo grandi vengono ruotati o divisi in parti uguali con le loro alette.
- I pezzi creati si aggiungono alla barra del planner; ZIP con tutti i pezzi del circuito, i supporti e un LEGGIMI.
- Larghezza pista del planner aggiornata alle misure reali (238 mm, corsie a 59 mm dal centro).
- Progetto aperto ai contributi: CONTRIBUTING.md, modelli per bug, idee e nuovi pezzi, modello per le pull request.
- Test automatici (motore 3D e app) su ogni pull request e prima di ogni release.

## [1.0.5] - 2026-11-03

- Il progetto diventa open source con licenza MIT (file `LICENSE`, `package.json`, README).

## [1.0.4] - 2026-11-03

- macOS: l'app è firmata ad-hoc dopo l'unione Intel + Apple Silicon, così i Mac con chip Apple non la rifiutano più come «danneggiata».
- Versione web pubblicata su GitHub Pages a ogni release (lab.cobelli.uk/Mini4WD-Track-Manager/), con icone vere per Dock e Home.
- README: istruzioni per il primo avvio su Mac.

## [1.0.3] - 2026-11-02

- Magazzino: la tabella con + e − resta sempre a altezza piena; lo storico non la accorcia più.
- Storico in un riquadro fisso da 5 righe che scorre al suo interno, con il conteggio dei movimenti.
- Lo stesso difetto (blocchi che si restringevano) è corretto in tutte le schede del pannello.

## [1.0.2] - 2026-11-02

- Magazzino: premendo + o − la pagina non scorre più verso l'alto spinta dallo storico.
- Clic ripetuti sullo stesso pezzo entro 2 minuti diventano una sola riga di storico (es. «+5 Curva 45°»).
- Storico compatto: ultime 8 righe, con «Mostra tutto».
- Cambiando scheda si riparte dall'inizio; restando nella stessa scheda la posizione viene mantenuta.

## [1.0.1] - 2026-11-02

- README con descrizione del progetto, spiegazione di magazzino, generatori di tracciati ed elementi extra.
- Screenshot di tutte le sezioni in `docs/screenshots/`.

## [1.0.0] - 2026-11-02

Prima versione pubblicata come release, con app desktop.

- App desktop per macOS (.dmg universale Intel/Apple Silicon) e Windows (installer e versione portable), funzionano anche offline.
- File HTML unico con icone incorporate, da caricare su un sito statico.
- Numero di versione visibile accanto al titolo.

Funzioni già presenti nelle versioni di prova precedenti:
- Editor pianta 2D con i pezzi del set MINI4WD 2 LANE DIY TRACK (MakerWorld 542904), verifica di chiusura, lunghezza corsie, ingombro.
- Vista 3D con pareti, cambio corsia sopraelevato e supporti.
- Elementi extra da MakerWorld: salto, sella, dosso, rampa rainbow, spirale, wall, rettilineo modulare 240.
- Distinta pezzi con ore di stampa e clip.
- Magazzino con storico dei movimenti.
- Idee: alternative ordinate per lo spazio disponibile e generatore casuale (scambio, salto, pista jump, velocità, tecnica, sopraelevata, spirale, compatta).
