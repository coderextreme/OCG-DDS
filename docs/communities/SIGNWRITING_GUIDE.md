# Sutton SignWriting Guide & International Sign Language Index

**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Maintainer Contact:** `yottzumm@gmail.com`  
**Repository:** <https://github.com/coderextreme/OCG-DDS>

---

## 1. How Sutton SignWriting Works in Lattice

Sutton SignWriting is a featural visual writing system (ISWA 2010) capable of representing **any sign language in the world**. Lattice implements SignWriting at three layers simultaneously:

1. **2D Spatial SVG SignBoxes (`SignWritingLane`)**  
   Every event renders an ordered sequence of visual SignBoxes showing:
   - **Head & Facial Non-Manual Markers (NMMs):** Raised brows (topic), furrowed brows (negation/warning), side-to-side headshake arrows, vertical nod arrow, or neutral face.
   - **Handshapes:** `Index (1)`, `Flat-B`, `Fist-A/S`, `Open-5`, `C-hand`, `F-link`, `V-bent`, and `X-hook` (one-handed or mirrored two-handed).
   - **Contact Symbols:** Touch (`*`), Grasp (`+`), Crossed stop (`×`).
   - **Movement Arrows:** Arc path, straight forward, converge together, pull apart, gather inward, wrist twist, and heavy halt bar.
   - **Vertical or Horizontal Reading Lanes:** Toggle between traditional **Vertical SignWriting Columns** and **Horizontal Lanes**.

2. **Formal SignWriting in ASCII (`FSW`)**  
   Standard ASCII SignBox tokens (`M535x540` boundary + `S<5-hex ISWA code><X>x<Y>` coordinate symbols), interoperable with SignPuddle / SignWriting tools.

3. **SignWriting in Unicode (`SWU`, Block `U+1D800`–`U+1DAAF`)**  
   Native Unicode 8.0+ Sutton SignWriting characters mapped for every handshape, contact, movement, and facial symbol. *(Note: On operating systems without an installed Sutton SignWriting font, the 2D SVG SignBoxes guarantee complete legibility while the Unicode SWU string remains copyable.)*

---

## 2. Supported International Sign Languages

| Code | Sign Language | Native Name | Syntax Order | Manual Alphabet / Lexical Bias |
| :--- | :--- | :--- | :--- | :--- |
| `ASL` | American Sign Language | American Sign Language | Topic-Comment | 1-handed |
| `BSL` | British Sign Language | British Sign Language | Topic-Comment | 2-handed |
| `LSF` | French Sign Language | Langue des Signes Française | Topic-Comment | 1-handed |
| `DGS` | German Sign Language | Deutsche Gebärdensprache | SOV (verb-final) | 1-handed |
| `LSE` | Spanish Sign Language | Lengua de Signos Española | SVO | 1-handed |
| `LIBRAS` | Brazilian Sign Language | Língua Brasileira de Sinais | SVO | 1-handed |
| `JSL` | Japanese Sign Language | 日本手話 (Nihon Shuwa) | SOV (verb-final) | 1-handed |
| `LSM` | Mexican Sign Language | Lengua de Señas Mexicana | Topic-Comment | 1-handed |
| `Auslan` | Australian Sign Language | Auslan | Topic-Comment | 2-handed |
| `IS` | International Sign | International Sign | Topic-Comment | 1-handed |
| **Any Custom** | Any ISO 639-3 / Name | e.g., `KSL`, `FSL`, `CSL`, `NZSL`, `SASL` | Topic-Comment | Adaptive |

---

## 3. SignWriting Editions of the Project README

Each file below provides localized **Gloss**, **Formal SignWriting (`FSW`)**, and **Unicode SignWriting (`SWU`)** translations of the Lattice README:

- [ASL SignWriting Edition (American Sign Language)](../signwriting/README.sw-ase.md)
- [BSL SignWriting Edition (British Sign Language)](../signwriting/README.sw-bfi.md)
- [LSF SignWriting Edition (Langue des Signes Française)](../signwriting/README.sw-fsl-lsf.md)
- [DGS SignWriting Edition (Deutsche Gebärdensprache)](../signwriting/README.sw-gsg.md)
- [LIBRAS SignWriting Edition (Língua Brasileira de Sinais)](../signwriting/README.sw-bzs.md)
- [JSL SignWriting Edition (日本手話 · Japanese Sign Language)](../signwriting/README.sw-jsl.md)
- [IS SignWriting Edition (International Sign)](../signwriting/README.sw-ils.md)

Native signers and SignWriting editors are warmly invited to refine local lexical signs, orientations, and regional FSW/SWU transcriptions via `yottzumm@gmail.com` or pull requests to `https://github.com/coderextreme/OCG-DDS`.
