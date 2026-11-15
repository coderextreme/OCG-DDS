# Editor de Grafos Distribuídos Acessível com Object-Capabilities (Português)

**Projeto:** Lattice · **Repositório:** <https://github.com/coderextreme/OCG-DDS> · **Contato:** `yottzumm@gmail.com`

Esta aplicação foi criada rapidamente com auxílio de IA. O autor ainda não lê Braille nem SignWriting e convida pessoas cegas, surdocegas e surdas a testar, enviar feedback ou ajudar a liderar o projeto.

## Recursos de Acessibilidade
- **Leitores de tela e teclado:** Atalhos `Alt+1`–`Alt+4` (módulos), `Alt+E` (console de edição), `ArrowLeft`/`ArrowRight`/`Home`/`End` nos diagramas, `?` (guia de atalhos) e regiões `aria-live`.
- **Braille:** Canal **Braille** de 40 células com **Show Dots** (`⠁`–`⠿`) e teclado Perkins de 6 pontos (`F D S` / `J K L`).
- **Protactile (PT):** Sem dependência de áudio, modo **High Contrast**, zonas táteis (`Zone A/B/C`) e cadências hápticas (**Pulse Haptics**).
- **Línguas de Sinais e SignWriting:** Canal **ASL** e **SignWriting** (`FSW`, `Unicode SWU`, quadros SVG 2D) com suporte a `LIBRAS`, `LGP` (personalizada), `ASL`, `BSL`, `LSF`, `DGS`, `LSE`, `JSL`, `LSM`, `Auslan` e `IS`.

## Instalação
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
Produção: `npm run build && npm run preview`

## Ressalvas
Estado mantido na memória do navegador (sem persistência remota ainda). O código precisa de revisão de segurança.
