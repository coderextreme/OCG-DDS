# Toegankelijke Gedistribueerde Graaf-Editor met Object-Capabilities (Nederlands)

**Project:** Lattice · **Repository:** <https://github.com/coderextreme/OCG-DDS> · **Contact:** `yottzumm@gmail.com`

Deze applicatie is snel ontwikkeld met hulp van AI. De auteur kan zelf geen Braille of SignWriting lezen en verwelkomt feedback en mede-leiderschap vanuit blinde, doofblinde en dove gemeenschappen.

## Toegankelijkheid
- **Schermlezer & Toetsenbord:** `Alt+1`–`Alt+4` (modules), `Alt+E` (invoerconsole), `ArrowLeft`/`ArrowRight`/`Home`/`End` in diagrammen, `?` (sneltoetsen) en `aria-live`-meldingen.
- **Braille:** 40-cells **Braille**-buffer met **Show Dots** (`⠁`–`⠿`) en 6-punts Perkins-invoer (`F D S` / `J K L`).
- **Protactile (PT):** Zonder geluid, **High Contrast**, ruimtelijke zones (`Zone A/B/C`) en haptische patronen (**Pulse Haptics**).
- **Gebarentaal & SignWriting:** **ASL** en **SignWriting** (`FSW`, `Unicode SWU`, 2D-SVG) voor `NGT` (aangepaste taal), `VGT`, `ASL`, `BSL`, `LSF`, `DGS`, `LSE`, `LIBRAS`, `JSL`, `LSM`, `Auslan` en `IS`.

## Installatie
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Productie: `npm run build && npm run preview`
*(Status: simulatie in browsergeheugen; beveiligingsreview gewenst.)*
