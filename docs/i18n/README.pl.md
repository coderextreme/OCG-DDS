# Dostępny Rozproszony Edytor Grafów z Object-Capabilities (Polski)

**Projekt:** Lattice · **Repozytorium:** <https://github.com/coderextreme/OCG-DDS> · **Kontakt:** `yottzumm@gmail.com`

Aplikacja powstała szybko przy wsparciu AI. Autor nie czyta jeszcze pisma Braille'a ani SignWriting i zaprasza osoby niewidome, głuchoniewidome oraz Głuche do testowania i współtworzenia projektu.

## Dostępność
- **Czytniki ekranu i klawiatura:** `Alt+1`–`Alt+4`, `Alt+E`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` oraz komunikaty `aria-live`.
- **Braille:** Bufor 40-znakowy (**Show Dots** `⠁`–`⠿`) oraz wprowadzanie 6-punktowe Perkinsa (`F D S` / `J K L`).
- **Protactile (PT):** Brak zależności od dźwięku, tryb **High Contrast**, strefy dotykowe (`Zone A/B/C`) i wzorce wibracji (**Pulse Haptics**).
- **Języki migowe i SignWriting:** Wyjście **ASL** oraz **SignWriting** (`FSW`, `Unicode SWU`, karty SVG 2D) z możliwością wpisania dowolnego języka migowego (np. `PJM`).

## Uruchomienie
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Stan grafu jest przechowywany w pamięci przeglądarki; kod wymaga przeglądu bezpieczeństwa.)*
