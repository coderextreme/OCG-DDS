# सुलभ ऑब्जेक्ट-क्षमता वितरित ग्राफ़ संपादक (हिन्दी)

**परियोजना:** Lattice · **रिपॉज़िटरी:** <https://github.com/coderextreme/OCG-DDS> · **संपर्क:** `yottzumm@gmail.com`

यह एप्लिकेशन AI की सहायता से तेज़ी से बनाया गया है। लेखक अभी ब्रेल या SignWriting नहीं पढ़ सकते और दृष्टिबाधित, मूक-बधिर-दृष्टिबाधित (Deaf-Blind) तथा बधिर समुदायों से परीक्षण और मार्गदर्शन का अनुरोध करते हैं।

## सुगम्यता विशेषताएँ
- **स्क्रीन रीडर व कीबोर्ड:** `Alt+1`–`Alt+4` (मॉड्यूल), `Alt+E` (संपादन कंसोल), `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` (शॉर्टकट गाइड) और `aria-live` सूचनाएँ।
- **ब्रेल (इनपुट/आउटपुट):** 40-सेल **Braille** बफ़र (**Show Dots** `⠁`–`⠿`) और 6-डॉट पर्किन्स इनपुट (`F D S` / `J K L`)।
- **प्रोटैक्टाइल (PT):** शून्य ऑडियो निर्भरता, **High Contrast**, स्पर्श क्षेत्र (`Zone A/B/C`) और हैप्टिक पैटर्न (**Pulse Haptics**)।
- **सांकेतिक भाषा व SignWriting:** **ASL** तथा **SignWriting** (`FSW`, `Unicode SWU`, 2D SVG) — `ISL` (भारतीय सांकेतिक भाषा) सहित किसी भी अंतर्राष्ट्रीय सांकेतिक भाषा का समर्थन।

## सेटअप
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(वर्तमान में डेटा ब्राउज़र मेमोरी में रहता है; सुरक्षा समीक्षा अपेक्षित है।)*
