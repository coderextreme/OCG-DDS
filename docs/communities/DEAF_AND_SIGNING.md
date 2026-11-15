# Deaf & Signing Community Accessibility Guide

**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Maintainer Contact:** `yottzumm@gmail.com`  
**Repository:** <https://github.com/coderextreme/OCG-DDS>

Lattice treats visual sign languages—both **ASL Gloss / Sign Cards** and **Sutton SignWriting in any international sign language**—as first-class system interfaces alongside standard text.

---

## 1. Visual-First Design Principles

- **Zero Audio Dependency:** All confirmations, alerts, batch rollbacks, quorum outcomes, and object-capability denials are visual and tactile.
- **Explicit Spatial Structure:** The three distributed shards (`Shard-A`, `Shard-B`, `Shard-C`) map directly onto left, center, and right visual columns with directed arcs showing dependencies (`N1 -> N2`) and OCap badges (`[RWD]`, `[RW]`, `[R]`, `[LOCKED]`).
- **Configurable Contrast & Motion:** Choose `Light`, `Dark`, or `High Contrast` mode, and `Motion: Reduced` at any time from the top toolbar.

---

## 2. American Sign Language (ASL) Output & Editing

### 2.1 ASL Output Panel
1. Select **ASL** in **Output Channel** (top toolbar or right/bottom **Accessible Event Output** panel).
2. View the **Topic-Comment ASL Gloss** (for example: `[brows-furrowed] AUTHORITY KEY ++ ACTION FORBIDDEN IX-locus STOP [headshake]`).
3. Step through individual **Sign Cards** (`Prev Sign` / `Next Sign`), each specifying:
   - **Gloss**
   - **Handshape** (e.g., `X-hook + flat-B palm`, `C-hands`, `1-index`, `F-ok link`)
   - **Location** (signing space locus)
   - **Movement**
   - **Non-Manual Marker (`NMM`)** (e.g., `raised-brows (topic)`, `brows-furrowed`, `headshake`, `nod`)

### 2.2 ASL / Protactile Input Builder (`Alt + E`)
Open the **Multi-Modal Edit Console** (`Alt + E`) and select **ASL / Protactile Builder** to compose Topic-Comment edits (`NODE`, `ARC`, `GROUP`, `CAPABILITY`, `CRDT`, `RING`, `QUORUM`) using structured visual controls that compile directly into atomic cluster commands.

---

## 3. Sutton SignWriting Output in Any International Sign Language

Select **SignWriting** (`SignW`) in **Output Channel** to translate live cluster events into **2D Sutton SignWriting SignBoxes**, **Formal SignWriting (`FSW`)**, and **Unicode SignWriting (`SWU`, `U+1D800`–`U+1DAAF`)**:

- **10 Built-In International Sign Language Presets:**
  - `ASL` (American Sign Language · Topic-Comment · 1H)
  - `BSL` (British Sign Language · Topic-Comment · 2H)
  - `LSF` (Langue des Signes Française · Topic-Comment · 1H)
  - `DGS` (Deutsche Gebärdensprache · SOV · 1H)
  - `LSE` (Lengua de Signos Española · SVO · 1H)
  - `LIBRAS` (Língua Brasileira de Sinais · SVO · 1H)
  - `JSL` (日本手話 Japanese Sign Language · SOV · 1H)
  - `LSM` (Lengua de Señas Mexicana · Topic-Comment · 1H)
  - `Auslan` (Australian Sign Language · Topic-Comment · 2H)
  - `IS` (International Sign · Topic-Comment · 1H)
  - `NZSL` (New Zealand Sign Language)
  - `CSL` (Chinese Sign Language)
  - `TSL` (Taiwan Sign Language)
  - `KSL` (Kenyan Sign Language)
  - `SASL` (South African Sign Language)
  - `ISL-IN` (Indo-Pakistani Sign Language)
  - `BdSL` (Bangladeshi Sign Language)
  - `LIS` (Italian Sign Language)
  - `NGT` (Sign Language of the Netherlands)
  - `STS` (Swedish Sign Language)
  - `PJM` (Polish Sign Language)
  - `ISL-IE` (Irish Sign Language)
- **Any Custom International Sign Language:** Choose **`Custom Sign Language (Any ISO 639-3 / Name)...`**, enter any language code or name (such as `KSL`, `FSL`, `CSL`, `NZSL`, `SASL`, `UgSL`, etc.), and click **Apply**.
- **Lane Orientation:** Toggle between traditional **Vertical Lane** (top-to-bottom column) and **Horizontal Lane**.
- **Encoding Copy:** Switch between **`FSW (ASCII)`** and **`Unicode SWU`** and click **Copy**.

For full SignWriting documentation and SignWriting versions of this README in multiple national sign languages, see [SignWriting Guide & Translations](./SIGNWRITING_GUIDE.md).


## 4. International language and communication profiles

The toolbar's **Blind, Deaf & Deafblind** selector groups international Braille
codes separately from DeafBlind communication approaches. The SignWriting target
selector remains the place to choose a specific national or regional sign language.

DeafBlind methods listed include Protactile, Tactile ASL, Tactile BSL, hands-on
signing, close-vision signing, tracking, Lorm, deafblind manual alphabets, and
tactile fingerspelling. These are not interchangeable systems. Preferred contact,
language, pace, and consent must be agreed directly with each communication
partner.

**Prototype limitation:** choosing a profile selects the existing Braille or
Protactile output channel and saves the preference locally. It does not yet
translate into the selected national Braille code or interpret/sign in a natural
sign language. SignWriting gloss output is experimental and requires validation
by native signers and DeafBlind community members.
