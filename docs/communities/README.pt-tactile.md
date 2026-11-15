# Protactile (PT) Contact-Space README
**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Maintainer:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. Grounded Contact-Space Overview
- `[CONTACT-FRAME]` Two-hand grounded frame on listener forearm & palm.
- `[TOPIC :: SYSTEM]` Distributed graph across 3 tactile spatial anchors + Object-Capability security guardrails.
- `[CAVEAT :: HONEST]` Built rapidly with AI assistance. Author does not yet read Protactile, Braille, or SignWriting directly and welcomes Deaf-Blind co-leaders, testers, and corrections at `yottzumm@gmail.com`.

## 2. Tactile Body-Space Map
- **Zone A (Left Forearm Anchor):** `Shard-A` nodes (`N1 Ingress`, `N2 Auth Verifier`).
- **Zone B (Center Palm / Wrist Anchor):** `Shard-B` nodes (`N3 Ledger`, `N4 Replica`) + Active Capability Key anchor.
- **Zone C (Right Forearm Anchor):** `Shard-C` nodes (`N5 Audit Sink`).

## 3. Core Protactile Event Grammar
- **Create / Trace Arc:** Light press at source anchor -> 1-finger continuous slide across contact space -> firm tap on target anchor.
- **Group Select & Atomic Batch:** Two-hand enclosure sweep across chosen anchors -> `FIRM-SINGLE-TAP` commit (`[120ms, 60ms, 180ms]`).
- **Capability Denial / Revocation:** Crossed-bar press on active capability wrist anchor + `DOUBLE-TAP-HOLD` (`[180ms, 80ms, 180ms, 80ms, 300ms]`).
- **Network Partition / Failure:** Crisp lift-off break along link line between anchors.
- **CRDT Sync / Merkle Convergence:** Bilateral inward palm sweep bringing Zone A, Zone B, and Zone C anchors together.

## 4. Two-Way Input & Output
- **Output:** Select `Protactile` (`PT`) in the Output Channel bar and activate **Pulse Haptics** (`navigator.vibrate`) or read structured tactile cues via refreshable Braille.
- **Input (`Alt + E`):** Use the **ASL / Protactile Builder** (choose Zone A/B/C + Action) or **6-Dot Braille Perkins Input** (`F D S / J K L`).

## 5. Setup Commands (Print / Terminal)
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install
npm run dev
```
*Note: Graph and replica state lives in browser memory for the current session; remote persistence and security auditing remain open community tasks.*
