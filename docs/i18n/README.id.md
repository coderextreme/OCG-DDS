# Editor Graf Terdistribusi Aksesibel dengan Object-Capability (Bahasa Indonesia)

**Proyek:** Lattice · **Repositori:** <https://github.com/coderextreme/OCG-DDS> · **Kontak:** `yottzumm@gmail.com`

Aplikasi ini dibuat cepat dengan bantuan AI. Penulis belum dapat membaca Braille maupun SignWriting dan mengundang komunitas Tunanetra, Tuli-Buta, dan Tuli untuk menguji serta ikut memimpin proyek ini.

## Aksesibilitas
- **Pembaca Layar & Papan Ketik:** `Alt+1`–`Alt+4`, `Alt+E`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?`, serta pengumuman `aria-live`.
- **Braille:** Penyangga **Braille** 40-sel (**Show Dots** `⠁`–`⠿`) dan input Perkins 6-titik (`F D S` / `J K L`).
- **Protactile (PT):** Tanpa ketergantungan audio, mode **High Contrast**, zona taktil (`Zone A/B/C`), dan pola getar (**Pulse Haptics**).
- **Bahasa Isyarat & SignWriting:** Output **ASL** dan **SignWriting** (`FSW`, `Unicode SWU`, kotak SVG 2D) untuk bahasa isyarat internasional apa pun (mis. `BISINDO`).

## Instalasi
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Saat ini berjalan di memori peramban; audit keamanan masih diperlukan.)*
