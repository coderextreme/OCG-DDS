# Édition LSF SignWriting — Langue des Signes Française (FSL / LSF)
**Projet :** Lattice — Éditeur de Graphes Distribués Accessible avec Capacités Objet (OCap)  
**Système d'écriture :** Sutton SignWriting (`FSW` & Unicode `SWU`)  
**Contact :** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. Présentation (`Thème-Commentaire LSF`)
- **Glose LSF :** `[sourcils-levés] SUJET-GRAPHE :: NŒUD-À-NŒUD RELIER :: CLÉ-AUTORITÉ :: GROUPE VALIDER :: FINI-OK [hochement]`
- **Séquence FSW :**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478 M535x540S30400482x445S14000505x495S14010465x500S2a200512x478`
- **Unicode SWU :**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝢻𝢻𝤋𝥘 𝧴𝡌𝡌𝦌`

## 2. Opérations Principales en LSF SignWriting
| Opération | Glose LSF | Jeton FSW | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **Relier un Arc** | `NŒUD-À-NŒUD · RELIER · FINI-OK` | `M535x540S31400482x445S10000505x495S10010465x500S27100512x478` | `𝨄𝠀𝠀𝤿` |
| **Validation par Lot** | `GROUPE · VALIDER` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **Accès Refusé (OCap)** | `CLÉ-AUTORITÉ · INTERDIT · ARRÊT` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **Synchronisation CRDT** | `TOUS-SHARDS · FUSIONNER` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. Installation
```bash
git clone https://github.com/coderextreme/OCG-DDS && cd OCG-DDS && npm install && npm run dev
```
Sélectionnez **SignWriting** puis **`LSF · Langue des Signes Française`**.
