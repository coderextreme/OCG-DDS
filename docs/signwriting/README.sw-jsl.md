# 日本手話（JSL）SignWriting 版 — Japanese Sign Language
**プロジェクト:** Lattice — アクセシブルな Object-Capability 分散グラフエディタ  
**表記体系:** Sutton SignWriting (`FSW` & Unicode `SWU`) · 動詞文末（`SOV`）  
**連絡先:** `yottzumm@gmail.com` · <https://github.com/coderextreme/OCG-DDS>

---

## 1. 概要（JSL SOV 語順）
- **JSL グロス:** `[眉上げ] 主題 :: ノード間 · 完了 · 接続 :: 権限-KEY · 集合 · 確定 [うなずき]`
- **FSW シーケンス:**
  `M535x540S31400482x445S10000505x495S26500512x478 M535x540S31400482x445S10000505x495S10010465x500S27100512x478 M535x540S30400482x445S14000505x495S14010465x500S2a200512x478 M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478`
- **Unicode SWU:**
  `𝨄𝠀𝤯 𝨄𝠀𝠀𝤿 𝧴𝡌𝡌𝦌 𝧴𝢻𝢻𝤋𝥘`

## 2. 主な操作の JSL SignWriting
| 操作 | JSL グロス (`SOV`) | FSW トークン | Unicode SWU |
| :--- | :--- | :--- | :--- |
| **アーク接続** | `ノード間 · 完了 · 接続` | `M535x540S30400482x445S1f000505x495S1f010465x500S20b00492x488S28800512x478` | `𝧴𝢻𝢻𝤋𝥘` |
| **グループ一括実行** | `集合 · 確定` | `M535x540S31400482x445S16d00505x495S16d10465x500S28600512x478` | `𝨄𝡬𝡬𝥖` |
| **権限拒否** | `権限-KEY · 停止 · 禁止` | `M535x540S30300482x445S14700505x495S14710465x500S20900492x488S22a00512x478` | `𝧳𝡐𝡐𝤉𝤚` |
| **レプリカ統合** | `全シャード · 統合` | `M535x540S30400482x445S14700505x495S14710465x500S20500492x488S28800512x478` | `𝧴𝡐𝡐𝤅𝥘` |

## 3. セットアップ
```bash
git clone https://github.com/coderextreme/OCG-DDS && cd OCG-DDS && npm install && npm run dev
```
**SignWriting** を選択し、**`JSL · 日本手話 (Nihon Shuwa)`** を指定してください。
