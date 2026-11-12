# Pokémon Karten Portfolio Tracker

Ein clientseitiger Portfolio-Tracker für Pokémon-Sammelkarten mit automatischer Kartenerkennung, Preisverfolgung und Gewinn-/Verlustanalyse.

## Features

- **Karte per Foto hinzufügen** — Lade ein Foto deiner Pokémon-Karte hoch. Die App erkennt per OCR (Tesseract.js) den Kartennamen und die Set-Nummer und durchsucht die Pokémon TCG API nach Treffern.
- **Manuelle Suche** — Alternativ kann nach Kartenname oder Set-Nummer gesucht werden.
- **Automatische Kartendaten** — Name, Set, Nummer, Seltenheit, Kartenbild und aktueller Marktpreis werden automatisch von der API geladen.
- **Kaufpreis & Gewinn/Verlust** — Trage deinen Kaufpreis ein und sieh auf einen Blick, ob du im Plus oder Minus bist.
- **Portfolio-Dashboard** — Gesamtwert, Gesamtkosten, Gesamtgewinn/-verlust und Kartenanzahl.
- **Preise aktualisieren** — Hole per Klick die aktuellen Marktpreise für alle Karten.
- **Suchen & Sortieren** — Filtere und sortiere deine Sammlung nach Name, Wert, Gewinn oder Datum.
- **Responsive Design** — Funktioniert auf Desktop und Handy.
- **Dunkles Theme** — Mit Pokémon-Farbakzenten (Rot/Gelb).

## Technologie

- **HTML / CSS / JavaScript** — Kein Framework, kein Build-Schritt.
- **localStorage** — Alle Daten bleiben im Browser gespeichert.
- **[Pokémon TCG API](https://pokemontcg.io)** — Kartendaten und Preise (kein API-Key nötig).
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** — OCR im Browser (via CDN).

## Starten

1. Repository klonen oder Dateien herunterladen.
2. `index.html` im Browser öffnen — fertig.

Kein Server, kein Build, keine Installation nötig.

```bash
git clone https://github.com/DEIN-USER/pokemon-card-tracker.git
cd pokemon-card-tracker
open index.html    # macOS
# oder: xdg-open index.html (Linux) / start index.html (Windows)
```

## Projektstruktur

```
pokemon-card-tracker/
├── index.html    # Haupt-HTML
├── style.css     # Styles (Dark Theme)
├── app.js        # Gesamte App-Logik
└── README.md     # Diese Datei
```

## Hinweise

- Die Bilderkennung (OCR) funktioniert am besten mit gut ausgeleuchteten, scharfen Fotos, auf denen der Kartenname und die Set-Nummer lesbar sind.
- Marktpreise stammen aus dem Feld `cardmarket.prices.averageSellPrice` der TCG API.
- Alle Daten werden ausschließlich lokal im Browser gespeichert (`localStorage`). Beim Löschen der Browserdaten geht das Portfolio verloren.
