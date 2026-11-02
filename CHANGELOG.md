# Changelog

Versioni secondo [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.
- PATCH: correzioni che non cambiano il funzionamento (es. 1.0.1)
- MINOR: nuove funzioni compatibili (es. 1.1.0)
- MAJOR: cambi che rompono i circuiti o i dati salvati (es. 2.0.0)

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
