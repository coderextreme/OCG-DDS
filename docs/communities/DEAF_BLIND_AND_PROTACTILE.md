# Deaf-Blind & Protactile (PT) Accessibility Guide

**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Maintainer Contact:** `yottzumm@gmail.com`  
**Repository:** <https://github.com/coderextreme/OCG-DDS>

Lattice is built with a **zero-audio dependency** architecture tailored for **Deaf-Blind**, **Protactile (PT)**, **refreshable Braille**, and **high-contrast / tactile-visual** users.

---

## 1. Visual & Tactile Configuration

- **High Contrast Display Mode:** Select **High Contrast** in the **Display Contrast** toolbar (`Light` | `Dark` | `High Contrast`) for maximum foreground/background separation (`#000000` canvas with `#FFFFFF` / high-luminance borders and cyan/amber accents).
- **Reduced Motion:** Toggle **Motion: Reduced** to disable animated transitions (`prefers-reduced-motion` compliant).
- **Zero Audio:** No sound, spoken-only alerts, or audio captchas exist anywhere in the application.

---

## 2. Protactile Language (PT) Spatial Mapping

When **Output Channel** is set to **Protactile** (`PT`), every distributed graph and security event renders a structured Protactile cue in the **Accessible Event Output** panel:

| Distributed Target | Protactile Contact-Space Anchor | Purpose |
| :--- | :--- | :--- |
| **Shard-A** | `Left Forearm Anchor (Zone A)` | Ingress & Auth boundary nodes (`N1`, `N2`, ...) |
| **Shard-B** | `Center Palm / Wrist Anchor (Zone B)` | Primary Ledger & Replica nodes (`N3`, `N4`, ...) |
| **Shard-C** | `Right Forearm Anchor (Zone C)` | Audit Sink & Cold Archive nodes (`N5`, ...) |
| **Multi-Shard / System** | `Contact Canvas (Module)` | Cluster-wide OCap, Quorum, or Merkle events |

### Topographic Traces & Backchannel Cadence
- **Arc Creation / Update:** *Press source anchor, slide 1-finger linear arc to target anchor.*
- **Group / Batch Commit:** *Two-hand sweep enclosing selected group boundary, then firm tap-commit.*
- **Capability Denial / Revocation:** *Crossed-bar press on active capability wrist anchor (blocked boundary).*
- **Replica Partition / Node Failure:** *Lift-off break along replica link line (connection severed).*
- **CRDT Convergence / Merkle Repair:** *Bilateral inward palm sweep bringing replica anchors together.*

### Backchannel Signals & Hardware Vibration (`Pulse Haptics`)
- **Info (`LIGHT-TAP`):** `[90ms]`
- **Confirmed / Committed (`FIRM-SINGLE-TAP`):** `[120ms, 60ms, 180ms]`
- **Warning / OCap Denied (`DOUBLE-TAP-HOLD`):** `[180ms, 80ms, 180ms, 80ms, 300ms]`

Activate **Pulse Haptics** in the Protactile panel to trigger `navigator.vibrate(...)` on supported mobile/tactile browsers, or inspect the visual millisecond cadence directly.

---

## 3. Refreshable Braille Display & 6-Dot Perkins Editing

Deaf-Blind Braille users have full read/write symmetry:
- **Output:** Switch to **Braille** for 40-cell chunked announcements and toggle **Show Dots** to inspect raw Unicode Braille (`⠁`–`⠿`).
- **Input (`Alt + E`):**
  - **6-Dot Braille Tab:** Use Perkins keys `F D S` (Dots 1–3) and `J K L` (Dots 4–6), `Space` to commit cell, `Backspace` to erase, and `Enter` to run.
  - **ASL / Protactile Builder Tab:** Choose Target Spatial Zone (`Zone A`, `Zone B`, `Zone C`), Action (`NODE CREATE`, `NODE UPDATE`, `ARC CONNECT`, `OCAP USE/REVOKE`, `BATCH COMMIT`, `QUORUM SET`), and parameters via structured dropdowns and buttons without freehand typing.

---

## 4. Protactile Summary (Contact-Space Notation)

```text
[PT CONTACT-FRAME :: TWO-HAND GROUNDED]
ANCHOR-A (LEFT-FOREARM)  = SHARD-A NODES
ANCHOR-B (CENTER-PALM)   = SHARD-B NODES + ACTIVE CAPABILITY KEY
ANCHOR-C (RIGHT-FOREARM) = SHARD-C NODES
ARC TRACE                = SOURCE-ANCHOR --(1-FINGER SLIDE)--> TARGET-ANCHOR
GROUP / BATCH            = TWO-HAND ENCLOSURE SWEEP + FIRM-SINGLE-TAP
CAPABILITY BLOCK         = CROSSED-BAR WRIST PRESS + DOUBLE-TAP-HOLD [180-80-180-80-300ms]
```

Feedback from Deaf-Blind and Protactile communities is warmly invited at **`yottzumm@gmail.com`**.
