<div dir="rtl">

# עורך גרפים מבוזר ונגיש מבוסס Object-Capabilities (עברית)

**פרויקט:** Lattice · **מאגר:** <https://github.com/coderextreme/OCG-DDS> · **יצירת קשר:** `yottzumm@gmail.com`

יישום זה נבנה במהירות בעזרת בינה מלאכותית. המחבר אינו קורא עדיין כתב ברייל או SignWriting, ומזמין קהילות עיוורים, חירשים-עיוורים וחירשים לבדוק, להעיר או להשתתף בהובלת הפרויקט.

## נגישות
- **קוראי מסך ומקלדת:** מעבר בין מודולים (`Alt+1`–`Alt+4`), מסוף עריכה (`Alt+E`), ניווט ליניארי (`ArrowLeft`/`ArrowRight`/`Home`/`End`), מדריך מקלדת (`?`) ואזורי `aria-live`.
- **ברייל:** חוצץ **Braille** בן 40 תאים עם **Show Dots** (`⠁`–`⠿`) והקלדת פרקינס בת 6 נקודות (`F D S` / `J K L`).
- **Protactile (PT):** ללא תלות בשמע, מצב **High Contrast**, אזורי מגע (`Zone A/B/C`) ורטט (**Pulse Haptics**).
- **שפות סימנים ו-SignWriting:** פלט **ASL** ו-**SignWriting** (`FSW`, `Unicode SWU`, תיבות SVG דו-ממדיות) לכל שפת סימנים בינלאומית או מותאמת (למשל `ISL`).

## התקנה מקומית

</div>

```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```

<div dir="rtl">

*(נשמר בזיכרון הדפדפן בלבד בשלב זה; נדרשת בדיקת אבטחה.)*

</div>
