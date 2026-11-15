# Erişilebilir Nesne-Yetkili Dağıtık Çizge Düzenleyici (Türkçe)

**Proje:** Lattice · **Depo:** <https://github.com/coderextreme/OCG-DDS> · **İletişim:** `yottzumm@gmail.com`

Bu uygulama yapay zekâ desteğiyle hızlıca geliştirildi. Yazar henüz Braille veya SignWriting okuyamamaktadır; kör, sağır-kör ve sağır toplulukların geri bildirimlerini ve proje liderliği desteğini beklemektedir.

## Erişilebilirlik
- **Ekran Okuyucu ve Klavye:** Modüller (`Alt+1`–`Alt+4`), düzenleme konsolu (`Alt+E`), doğrusal gezinme (`ArrowLeft`/`ArrowRight`/`Home`/`End`), kısayol kılavuzu (`?`) ve `aria-live`.
- **Braille:** 40 hücreli **Braille** tamponu (**Show Dots** `⠁`–`⠿`) ve 6 noktalı Perkins girişi (`F D S` / `J K L`).
- **Protactile (PT):** Sıfır ses bağımlılığı, **High Contrast**, dokunsal alanlar (`Zone A/B/C`) ve titreşim (**Pulse Haptics**).
- **İşaret Dilleri ve SignWriting:** **ASL** ve **SignWriting** (`FSW`, `Unicode SWU`, 2D SVG) çıktısı; `TİD` dahil tüm uluslararası ve özel işaret dilleri desteklenir.

## Kurulum
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(Veriler şu an tarayıcı belleğinde tutulur; güvenlik incelemesi gereklidir.)*
