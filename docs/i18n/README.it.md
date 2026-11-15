# Editor di Grafi Distribuiti Accessibile con Object-Capabilities (Italiano)

**Progetto:** Lattice · **Repository:** <https://github.com/coderextreme/OCG-DDS> · **Contatto:** `yottzumm@gmail.com`

Applicazione realizzata rapidamente con il supporto dell'IA. L'autore non legge ancora Braille né SignWriting e invita le comunità cieche, sordocieche e sorde a provare il sistema o contribuire alla guida del progetto.

## Accessibilità
- **Screen reader e tastiera:** `Alt+1`–`Alt+4` per i moduli, `Alt+E` per la console, `ArrowLeft`/`ArrowRight`/`Home`/`End` per esplorare nodi e bucket, `?` per la guida e regioni `aria-live`.
- **Braille:** Buffer **Braille** a 40 celle con **Show Dots** (`⠁`–`⠿`) e input Perkins a 6 punti (`F D S` / `J K L`).
- **Protactile (PT):** Zero audio, **High Contrast**, zone tattili (`Zone A/B/C`) e pattern aptici (**Pulse Haptics**).
- **Lingua dei Segni e SignWriting:** Output **ASL** e **SignWriting** (`FSW`, `Unicode SWU`, box SVG 2D) per lingue predefinite o qualsiasi lingua personalizzata (es. `LIS`).

## Avvio Locale
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Produzione: `npm run build && npm run preview`

## Note
I dati risiedono attualmente in memoria nel browser; persistenza remota e audit di sicurezza sono ancora aperti.
