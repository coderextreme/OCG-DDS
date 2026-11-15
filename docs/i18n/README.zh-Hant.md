# 無障礙物件能力分散式圖編輯器（繁體中文）

**專案：** Lattice · **儲存庫：** <https://github.com/coderextreme/OCG-DDS> · **聯絡：** `yottzumm@gmail.com`

本應用於 AI 協助下快速建置。作者目前尚未閱讀點字或手語書寫（SignWriting），誠摯邀請視障、視聽雙障及聽障社群協助測試與共同領導本專案。

## 無障礙功能
- **螢幕報讀與鍵盤：** `Alt+1`–`Alt+4` 切換模組、`Alt+E` 聚焦編輯台、`ArrowLeft`/`ArrowRight`/`Home`/`End` 線性瀏覽節點與雜湊環、`?` 鍵盤指南與 `aria-live` 通知。
- **點字（輸入/輸出）：** 40 格 **Braille** 顯示緩衝區（**Show Dots** 切換 Unicode 點字 `⠁`–`⠿`）及 6 點柏金斯鍵入（`F D S` / `J K L`）。
- **觸覺手語（Protactile / PT）：** 零音訊依賴、**High Contrast** 高對比模式、空間觸覺區（`Zone A/B/C`）與震動節奏（**Pulse Haptics**）。
- **手語與 SignWriting：** **ASL** 與 **SignWriting**（`FSW`、`Unicode SWU`、2D SVG 圖框），內建多國手語並支援自訂任何國際手語（例如台灣手語 `TSL`、香港手語 `HKSL`）。

## 安裝與啟動
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(目前資料僅暫存於瀏覽器記憶體中；程式碼尚需安全性審查。)*
