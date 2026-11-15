# Tillgänglig Distribuerad Grafredigerare med Object-Capabilities (Svenska)

**Projekt:** Lattice · **Arkiv:** <https://github.com/coderextreme/OCG-DDS> · **Kontakt:** `yottzumm@gmail.com`

Skapad snabbt med AI-stöd. Författaren läser ännu inte punktskrift eller SignWriting och välkomnar testning och medledarskap från blinda, dövblinda och döva gemenskaper.

## Tillgänglighet
- **Skärmläsare & tangentbord:** `Alt+1`–`Alt+4`, `Alt+E`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` samt `aria-live`.
- **Punktskrift (Braille):** 40-teckens **Braille**-buffert (**Show Dots** `⠁`–`⠿`) och 6-punkts Perkins-inmatning (`F D S` / `J K L`).
- **Protactile (PT):** Ljudfri design, **High Contrast**, taktila zoner (`Zone A/B/C`) och haptik (**Pulse Haptics**).
- **Teckenspråk & SignWriting:** **ASL** och **SignWriting** (`FSW`, `Unicode SWU`, 2D-SVG) med stöd för valfritt teckenspråk (t.ex. `STS`).

## Installation
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Körs i webbläsarens minne; säkerhetsgranskning behövs.)*
