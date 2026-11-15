# Доступний розподілений редактор графів з Object-Capabilities (Українська)

**Проєкт:** Lattice · **Репозиторій:** <https://github.com/coderextreme/OCG-DDS> · **Контакт:** `yottzumm@gmail.com`

Застосунок створено швидко за допомогою ШІ. Автор ще не читає шрифтом Брайля чи SignWriting та запрошує незрячих, сліпоглухих і глухих користувачів до тестування та співкерівництва.

## Доступність
- **Екранні диктори та клавіатура:** `Alt+1`–`Alt+4`, `Alt+E`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` та `aria-live`.
- **Брайль:** 40-комірковий буфер **Braille** (**Show Dots** `⠁`–`⠿`) і 6-крапкове введення Перкінса (`F D S` / `J K L`).
- **Protactile (PT):** Без аудіо, **High Contrast**, зони дотику (`Zone A/B/C`) та вібросигнали (**Pulse Haptics**).
- **Жестові мови та SignWriting:** **ASL** і **SignWriting** (`FSW`, `Unicode SWU`, 2D SVG) для пресетів або будь-якої жестової мови (напр. `UKL` — УЖМ).

## Встановлення
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Стан зберігається лише в пам'яті браузера; потрібен аудит безпеки.)*
