# Accessible Object-Capability Distributed Graph Editor

I vibe-coded this application application in a matter of hours.  Thanks for the hard work that made this possible.  I can't read Braille or SignWriting, so I don't know how this will make you feel.

If someone wants to help lead this project, contact me at yottzumm@gmail.com

Translations of this README.md are welcome, or I could use AI/LLM.

# Setup

Get Node.js with NPM, Git or GitHub Desktop (no instructions, apologies).

https://nodejs.org/

```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
```
# Development
```bash
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
# go to link in terminal
```

## Production
```bash
npm run build
npm run preview
# go to link in terminal
```

The SignWriting log is on the right side or bottom of the page, depending on size and orientation of your screen.  There's a choice of language, and I don't know about translation to SignWriting.

You access Braille by pressing Braille buttons, then pressing the "Show dots."  Apparently, Braille input might be available, I don't know the status.  Please test and give feedback.

As for other accessiblity, I don't know yet.

## Caveats
I don't know if this is actually live or the graph is stored at this point.  So far, I have the front end kind of working.  The code needs to be reviewed for vulnerabilities

*(Technical note on current build: graph, CRDT replica, hash ring, quorum, and OCap state runs deterministically in browser memory for the current session without remote persistence. Keyboard/screen-reader navigation, 40-cell Braille output, 6-dot Perkins chord input `F D S / J K L`, Protactile cues & haptics, ASL Gloss/Builder, and Sutton SignWriting `FSW`/`SWU`/2D SVG outputs are implemented and open for community testing.)*

---

## Community & Accessibility Guides
- [Blind & Screen Reader Guide (NVDA / JAWS / VoiceOver / Orca)](./docs/communities/BLIND_AND_SCREEN_READER.md)
- [Deaf-Blind & Protactile (PT) Accessibility Guide](./docs/communities/DEAF_BLIND_AND_PROTACTILE.md)
- [Protactile (PT) Contact-Space README](./docs/communities/README.pt-tactile.md)
- [Deaf & Signing Community Guide (ASL & Visual-First)](./docs/communities/DEAF_AND_SIGNING.md)
- [Sutton SignWriting Guide & International Sign Languages](./docs/communities/SIGNWRITING_GUIDE.md)

## Braille Editions
- [English README in Braille](./README.braille)
- [Full Keyboard & Operations User Guide in UEB Grade-1 Braille](./docs/braille/USER_GUIDE.ueb.braille)
- [Español en Braille](./docs/braille/README.es.braille)
- [Français en Braille](./docs/braille/README.fr.braille)
- [Deutsch in Brailleschrift](./docs/braille/README.de.braille)

## SignWriting Editions (FSW + Unicode SWU + Gloss)
- [ASL SignWriting (`ASE`) — American Sign Language](./docs/signwriting/README.sw-ase.md)
- [BSL SignWriting (`BFI`) — British Sign Language](./docs/signwriting/README.sw-bfi.md)
- [LSF SignWriting (`FSL`) — Langue des Signes Française](./docs/signwriting/README.sw-fsl-lsf.md)
- [DGS SignWriting (`GSG`) — Deutsche Gebärdensprache](./docs/signwriting/README.sw-gsg.md)
- [LIBRAS SignWriting (`BZS`) — Língua Brasileira de Sinais](./docs/signwriting/README.sw-bzs.md)
- [JSL SignWriting (`JSL`) — 日本手話 (Japanese Sign Language)](./docs/signwriting/README.sw-jsl.md)
- [IS SignWriting (`ILS`) — International Sign](./docs/signwriting/README.sw-ils.md)

## Spoken & Written Language Translations
| Language | Native Name | Documentation |
| :--- | :--- | :--- |
| Arabic | العربية | [docs/i18n/README.ar.md](./docs/i18n/README.ar.md) |
| Bengali | বাংলা | [docs/i18n/README.bn.md](./docs/i18n/README.bn.md) |
| Chinese (Simplified) | 简体中文 | [docs/i18n/README.zh-Hans.md](./docs/i18n/README.zh-Hans.md) |
| Chinese (Traditional) | 繁體中文 | [docs/i18n/README.zh-Hant.md](./docs/i18n/README.zh-Hant.md) |
| Dutch | Nederlands | [docs/i18n/README.nl.md](./docs/i18n/README.nl.md) |
| Esperanto | Esperanto | [docs/i18n/README.eo.md](./docs/i18n/README.eo.md) |
| French | Français | [docs/i18n/README.fr.md](./docs/i18n/README.fr.md) |
| German | Deutsch | [docs/i18n/README.de.md](./docs/i18n/README.de.md) |
| Hebrew | עברית | [docs/i18n/README.he.md](./docs/i18n/README.he.md) |
| Hindi | हिन्दी | [docs/i18n/README.hi.md](./docs/i18n/README.hi.md) |
| Indonesian | Bahasa Indonesia | [docs/i18n/README.id.md](./docs/i18n/README.id.md) |
| Italian | Italiano | [docs/i18n/README.it.md](./docs/i18n/README.it.md) |
| Japanese | 日本語 | [docs/i18n/README.ja.md](./docs/i18n/README.ja.md) |
| Korean | 한국어 | [docs/i18n/README.ko.md](./docs/i18n/README.ko.md) |
| Polish | Polski | [docs/i18n/README.pl.md](./docs/i18n/README.pl.md) |
| Portuguese | Português | [docs/i18n/README.pt.md](./docs/i18n/README.pt.md) |
| Russian | Русский | [docs/i18n/README.ru.md](./docs/i18n/README.ru.md) |
| Spanish | Español | [docs/i18n/README.es.md](./docs/i18n/README.es.md) |
| Swahili | Kiswahili | [docs/i18n/README.sw.md](./docs/i18n/README.sw.md) |
| Swedish | Svenska | [docs/i18n/README.sv.md](./docs/i18n/README.sv.md) |
| Turkish | Türkçe | [docs/i18n/README.tr.md](./docs/i18n/README.tr.md) |
| Ukrainian | Українська | [docs/i18n/README.uk.md](./docs/i18n/README.uk.md) |
| Vietnamese | Tiếng Việt | [docs/i18n/README.vi.md](./docs/i18n/README.vi.md) |


## International Blind, Deaf, and Deafblind Communication Profiles

The toolbar includes a **Blind, Deaf & Deafblind** profile selector. It separates
three different concepts rather than treating them as interchangeable languages:

- **Braille codes:** profiles include UEB, Spanish, French, German, Portuguese,
  Italian, Dutch, Polish, Russian, Arabic, Bharati, Bangla, Chinese, Japanese,
  and Korean Braille. Grade, contraction, and national variants remain explicit
  choices for future code-specific transcription support.
- **Sign languages:** the SignWriting target selector includes ASL, BSL, LSF,
  DGS, LSE, LIBRAS, JSL, LSM, Auslan, NZSL, CSL, TSL, Kenyan Sign Language,
  South African Sign Language, Indo-Pakistani Sign Language, Bangladeshi Sign
  Language, LIS, NGT, Swedish Sign Language, PJM, Irish Sign Language, and
  International Sign. These are distinct languages, not dialect labels for one
  universal sign language.
- **Deafblind communication profiles:** Protactile, Tactile ASL, Tactile BSL,
  hands-on signing, close-vision signing, tracking, Lorm, deafblind manual
  alphabets, and tactile fingerspelling are listed as communication approaches.

**Implementation boundary:** the profile selector records a preferred
communication approach and selects the corresponding existing output channel.
It does not yet implement a full national Braille translator, sign-language
interpreter, or standardized tactile grammar. In particular, SignWriting
glosses and generated tactile cues are prototypes, not validated translations.
Community review by native signers, Braille readers, and DeafBlind consultants
is required before these outputs should be relied on for critical communication.
