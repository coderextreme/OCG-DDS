# সহজলভ্য অবজেক্ট-ক্যাপাবিলিটি ডিস্ট্রিবিউটেড গ্রাফ এডিটর (বাংলা)

**প্রকল্প:** Lattice · **রিপোজিটরি:** <https://github.com/coderextreme/OCG-DDS> · **যোগাযোগ:** `yottzumm@gmail.com`

অ্যাপ্লিকেশনটি AI-এর সহায়তায় দ্রুত তৈরি করা হয়েছে। লেখক এখনও ব্রেইল বা SignWriting পড়তে পারেন না এবং দৃষ্টিপ্রতিবন্ধী, অন্ধ-বধির ও বধির সম্প্রদায়ের মতামত ও নেতৃত্ব কামনা করেন।

## সহজলভ্যতা
- **স্ক্রিন রিডার ও কীবোর্ড:** `Alt+1`–`Alt+4`, `Alt+E`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, `?` এবং `aria-live`।
- **ব্রেইল:** ৪০-সেলের **Braille** বাফার (**Show Dots** `⠁`–`⠿`) এবং ৬-ডট পার্কিনস ইনপুট (`F D S` / `J K L`)।
- **প্রোট্যাকটাইল (PT):** অডিও-মুক্ত নকশা, **High Contrast**, স্পর্শ অঞ্চল (`Zone A/B/C`) ও ভাইব্রেশন (**Pulse Haptics**)।
- **ইশারা ভাষা ও SignWriting:** **ASL** এবং **SignWriting** (`FSW`, `Unicode SWU`, 2D SVG) যেকোনো আন্তর্জাতিক বা কাস্টম ইশারা ভাষার জন্য।

## সেটআপ
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(বর্তমানে ব্রাউজার মেমোরিতে চলে; নিরাপত্তা যাচাই প্রয়োজন।)*
