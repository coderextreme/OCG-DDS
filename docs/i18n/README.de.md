# Barrierefreier verteilter Graph-Editor mit Object-Capabilities (Deutsch)

**Projekt:** Lattice · **Repository:** <https://github.com/coderextreme/OCG-DDS> · **Kontakt:** `yottzumm@gmail.com`

Diese Anwendung entstand in kurzer Zeit mit KI-Unterstützung. Vielen Dank an alle, deren Vorarbeit dies ermöglicht hat. Der Autor kann selbst kein Braille oder SignWriting lesen und bittet blinde, taubblinde und gehörlose Nutzerinnen und Nutzer ausdrücklich um Rückmeldung oder Mitarbeit an der Projektleitung.

## Barrierefreiheit
- **Screenreader & Tastatur:** Modulwechsel (`Alt+1`–`Alt+4`), Eingabekonsole (`Alt+E`), lineare Navigation durch Graph, Hash-Ring und Merkle-Baum (`ArrowLeft`/`ArrowRight`, `Home`/`End`), Tastaturhilfe (`?`) und `aria-live`-Meldungen.
- **Braille (Ein- & Ausgabe):** 40-stelliger **Braille**-Puffer mit **Show Dots** (Unicode-Braille `⠁`–`⠿`) sowie 6-Punkt-Perkins-Eingabe (`F D S` / `J K L`, `Leertaste`, `Rücktaste`, `Enter`).
- **Taubblinde / Protactile (PT):** Vollständig ohne Ton, **High Contrast**-Modus, räumliche Kontaktzonen (`Zone A/B/C`) und Vibrationsmuster (**Pulse Haptics**).
- **Gebärdensprache & SignWriting:** **ASL**-Ausgabe sowie **SignWriting** (`FSW`, `Unicode SWU`, 2D-SVG-Karten) für `DGS` (SOV-Wortstellung), `ASL`, `BSL`, `LSF`, `LSE`, `LIBRAS`, `JSL`, `LSM`, `Auslan`, `IS` und beliebige eigene Gebärdensprachen (z. B. `ÖGS`, `DSGS`).

## Einrichtung
Voraussetzungen: Node.js mit `npm` (<https://nodejs.org/>) und Git.
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Produktion:
```bash
npm run build
npm run preview
```

## Hinweise
Der Graph wird derzeit nur im Arbeitsspeicher des Browsers gehalten (noch keine entfernte Datenbank-Speicherung). Der Code sollte auf Sicherheitslücken geprüft werden.
