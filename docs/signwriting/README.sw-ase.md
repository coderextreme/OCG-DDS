# ASL SignWriting Edition — American Sign Language (ASE / ASL)
**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Writing System:** Sutton SignWriting (`FSW` & Unicode `SWU` `U+1D800`–`U+1DAAF`) · Vertical Column / Topic-Comment  
**Contact:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

> *Note for native ASL SignWriting readers:* Author built this rapidly with AI assistance and does not read SignWriting yet. Native ASL SignWriting corrections and SignPuddle refinements are warmly welcomed.

---

## 1. Title & Overview (`Topic-Comment`)
- **ASL Gloss:** `[raised-brows] GRAPH-TOPIC :: NODE-TO-NODE ARC-CONNECT :: AUTHORITY-KEY :: GROUP-SET COMMIT-LOCK :: ACCESSIBLE SIGNWRITING + BRAILLE + PROTACTILE [nod]`
- **FSW Sequence:**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478 M535x540S31800482x445S10a00505x495S10a10465x500S20500492x488S2a200512x478`
- **Unicode SWU:**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝢻𝢻𝤋𝥘 𝨈𝠐𝠐𝤅𝦌`

## 2. Core Operations in ASL SignWriting
| Operation | ASL Gloss | FSW Token | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **Create / Connect Arc** | `NODE-TO-NODE · ARC-CONNECT · FINISH-OK` | `M535x540S31400482x445S10000505x495S10010465x500S27100512x478` | `𝨄𝠀𝠀𝤿` |
| **Group / Batch Commit** | `GROUP-SET · COMMIT-LOCK` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **OCap Denied / Revoked** | `AUTHORITY-KEY · FORBIDDEN · STOP` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **CRDT / Merkle Merge** | `ALL-SHARDS · MERGE-EQUAL` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. Using SignWriting in the App
1. Select **SignWriting** (`SignW`) in **Output Channel**.
2. Keep target language on **`ASL · American Sign Language`** (or choose any other sign language).
3. Toggle **Vertical Lane** / **Horizontal Lane**, inspect SVG SignBoxes, and copy `FSW (ASCII)` or `Unicode SWU`.

## 4. Local Setup
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install
npm run dev
```
*(In-browser simulation; remote persistence and security audit are open TODOs.)*
