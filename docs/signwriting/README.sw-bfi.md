# BSL SignWriting Edition — British Sign Language (BFI / BSL)
**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Writing System:** Sutton SignWriting (`FSW` & Unicode `SWU`) · Two-Handed Manual Bias  
**Contact:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. Overview (`BSL Topic-Comment · 2H`)
- **BSL Gloss:** `[raised-brows] SUBJECT-TOPIC :: POINT-TO-POINT JOIN-LINK :: KEY-AUTHORITY (2H) :: COLLECT-GROUP LOCK-APPLY :: FINISHED (2H) [nod]`
- **FSW Sequence:**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478 M535x540S30400482x445S14000505x495S14010465x500S2a200512x478`
- **Unicode SWU:**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝢻𝢻𝤋𝥘 𝧴𝡌𝡌𝦌`

## 2. Core Operations in BSL SignWriting
| Operation | BSL Gloss | FSW Token | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **Connect Arc** | `POINT-TO-POINT · JOIN-LINK · FINISHED (2H)` | `M535x540S31400482x445S10000505x495S10010465x500S27100512x478` | `𝨄𝠀𝠀𝤿` |
| **Group / Batch Commit** | `COLLECT-GROUP · LOCK-APPLY` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **Capability Blocked** | `KEY-AUTHORITY (2H) · BLOCKED · HALT` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **Replica Convergence** | `EVERY-SHARD · MATCH-SAME` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. Setup (`Terminal`)
```bash
git clone https://github.com/coderextreme/OCG-DDS && cd OCG-DDS && npm install && npm run dev
```
Select **SignWriting** in **Output Channel** -> choose **`BSL · British Sign Language`**.
