# DGS SignWriting Ausgabe — Deutsche Gebärdensprache (GSG / DGS)
**Projekt:** Lattice — Barrierefreier verteilter Graph-Editor mit Object-Capabilities  
**Schriftsystem:** Sutton SignWriting (`FSW` & Unicode `SWU`) · Verb-Endstellung (`SOV`)  
**Kontakt:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. Überblick (`DGS-Syntax: Subjekt – Objekt – Verb`)
- **DGS-Glosse:** `[Brauen-hoch] THEMA :: KNOTEN-PFAD · FERTIG · VERBINDEN :: SCHLÜSSEL · GRUPPE · BESTÄTIGEN [Nicken]`
- **FSW-Sequenz:**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S14000505x495S14010465x500S2a200512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478`
- **Unicode SWU:**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝡌𝡌𝦌 𝧴𝢻𝢻𝤋𝥘`

## 2. Kernfunktionen in DGS SignWriting
| Aktion | DGS-Glosse (`SOV`) | FSW-Token | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **Kante verbinden** | `KNOTEN-PFAD · FERTIG · VERBINDEN` | `M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478` | `𝧴𝢻𝢻𝤋𝥘` |
| **Stapelverarbeitung** | `GRUPPE · BESTÄTIGEN` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **Zugriff verweigert** | `SCHLÜSSEL · STOPP · VERBOTEN` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **Replikate abgleichen** | `ALLE-SHARDS · ANGLEICHEN` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. Einrichtung
```bash
git clone https://github.com/coderextreme/OCG-DDS && cd OCG-DDS && npm install && npm run dev
```
Wählen Sie **SignWriting** -> **`DGS · Deutsche Gebärdensprache`**.
