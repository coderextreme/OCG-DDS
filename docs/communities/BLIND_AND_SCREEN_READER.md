# Blind & Screen Reader Accessibility Guide

**Project:** Lattice — Accessible Object-Capability Distributed Graph Editor  
**Maintainer Contact:** `yottzumm@gmail.com`  
**Repository:** <https://github.com/coderextreme/OCG-DDS>

This guide documents how Blind and low-vision users using **NVDA**, **JAWS**, **VoiceOver**, or **Orca**—with speech or a **refreshable Braille display**—can inspect, navigate, and edit every distributed graph node, directed arc, CRDT replica, Merkle bucket, consistent hash ring entry, quorum setting, and object-capability (OCap) token without using a mouse.

---

## 1. Screen Reader Landmarks & Live Regions

- **Skip Link:** Press `Tab` once on page load to focus **Skip to main content** (`#main-content`).
- **Primary Modules (`TopBar`):** Landmark navigation labeled `"Distributed graph and capability modules"`. Switch directly via `Alt + 1`..`Alt + 4`:
  - `Alt + 1` — **Graph Workspace** (distributed sharded graph + OCap guardrails + group/batch editor)
  - `Alt + 2` — **Sync & Quorum** (CRDT OR-Set/LWW-Map replicas, Merkle anti-entropy tree, `W + R > N` quorum)
  - `Alt + 3` — **Hash Sharding** (consistent hash ring + virtual nodes + replication factor)
  - `Alt + 4` — **Capabilities** (OCap attenuation/minting, delegation chains, cascading revocation, capability metadata editing)
- **Live Announcements (`Accessible Event Output`):**
  - Informational and confirmation events use `role="status"` (`aria-live="polite"`).
  - Capability denials, partition warnings, and rollbacks use `role="alert"` (`aria-live="assertive"`).
  - Switching the output channel (**Standard**, **Braille**, **Protactile**, **ASL**, **SignWriting**) re-formats the live announcement without discarding the latest cluster event.

---

## 2. Keyboard Navigation Across Visualizations

- **Distributed Graph, Hash Ring & Merkle Tree:**
  - `ArrowLeft` / `ArrowRight` — Step linearly through every node, ring entry, or Merkle bucket.
  - `Home` / `End` — Jump to the first or last entity.
- **Linear Text Adjacency Summary:**
  - Directly beneath the visual sharded graph canvas is a semantic `<ol>` list (**Linear Shard, OCap & Adjacency Summary**) listing each node's shard, status, active OCap right (`[RWD]`, `[RW]`, `[R]`, or `Locked`), and all outgoing arcs (`ID:label(w=weight)->target`).
- **Every Entity Has a Keyboard `Edit` Action:**
  - Every row in the **Nodes Directory**, **Arcs Directory**, **CRDT Replicas**, **Hash Ring Keys**, and **Capabilities Registry** has a focusable **Edit** button that loads that entity into the accessible editor.
  - **Quorum `W` / `R`** controls provide discrete **`-`** and **`+`** stepper buttons alongside range sliders.
- **Keyboard Reference Dialog:** Press `?` anywhere outside a text input (or activate **Keyboard Guide**) and `Escape` to close and restore focus.

---

## 3. Refreshable Braille Display & 6-Dot Perkins Input

### 3.1 40-Cell Braille Output Buffer
1. Select **Braille** in **Display / Output Channel** (top toolbar or right/bottom announcer panel).
2. The announcer formats events into **40-cell line chunks** prefixed with `[INFO ...]`, `[OK ...]`, or `[ALERT ...]`.
3. Activate **Show Dots** to render **Unicode Braille (`⠁`–`⠿`)** in the numbered `<ol>` buffer (`40-Cell Braille Display Buffer`), or keep ASCII mode if your screen reader prefers raw Grade-1 ASCII text before applying its own Braille translation table.

### 3.2 6-Dot Perkins Chord Editor (`Alt + E` -> `6-Dot Braille`)
1. Press `Alt + E` to jump to the **Multi-Modal Edit Console**.
2. Select the **6-Dot Braille** tab (`Command / SR` | `6-Dot Braille` | `ASL / Protactile Builder`).
3. Toggle dots using standard home-row Perkins chords (or click/focus the 6 dot buttons):
   - **Left hand:** `F` = Dot 1, `D` = Dot 2, `S` = Dot 3
   - **Right hand:** `J` = Dot 4, `K` = Dot 5, `L` = Dot 6
   - `Space` commits the active chord as a Unicode Braille cell (`⠀`–`⠿`).
   - `Backspace` removes the last Braille cell.
   - `Enter` translates the Braille buffer to ASCII and executes the edit command.
4. You can also paste or type Unicode Braille (`⠁`–`⠿`) directly into the **Command / SR** text box!

---

## 4. Text Command Grammar (`Command / SR`)

All commands execute immediately against the live state under active OCap guardrails and can be chained with `|` inside a single atomic batch:

```text
add node <id> "<label>" [Shard-A|Shard-B|Shard-C] [tag]
update node <id> label="<new>" shard=<Shard> status=<active|maintenance|isolated> tag=<tag>
delete node <id>

add arc <id> <source>-><target> [label] [w=<weight>] [tag=<tag>]
update arc <id> label="<new>" source=<src> target=<tgt> w=<weight> status=<status> tag=<tag>
delete arc <id>

select nodes <id1,id2,...> | select arcs <id1,id2,...>
batch <op1> | <op2> | ...

cap use <capId>
cap mint <parentCapId> "<label>" scope=<all|Shard-A|Shard-B|Shard-C> rights=<comma-separated>
cap edit <capId> label="<new>"
cap revoke <capId>

crdt add <R1|R2|R3> <tag> | crdt remove <R1|R2|R3> <tag> | crdt set <R1|R2|R3> <key> <val> | crdt sync
ring put <key> <status> | ring del <key> | ring rf <1..3> | ring toggle <nodeId>
quorum set w=<1..N> r=<1..N> | quorum write | quorum read
```

---

## 5. Honest Status & Request for Community Feedback

- **Persistence:** State is currently **client-side in memory** during your browser session (seeded deterministically on load or **Reset Cluster**); there is not yet a remote backend or persisted database.
- **Feedback Needed:** We welcome blind screen-reader and Braille users to test focus order, Perkins key chords, and Braille dot cell output and report issues via email (`yottzumm@gmail.com`) or GitHub (`https://github.com/coderextreme/OCG-DDS`).
