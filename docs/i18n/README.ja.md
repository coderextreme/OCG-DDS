# アクセシブルな Object-Capability 分散グラフエディタ（日本語）

**プロジェクト:** Lattice · **リポジトリ:** <https://github.com/coderextreme/OCG-DDS> · **連絡先:** `yottzumm@gmail.com`

本アプリは AI の支援を得て短時間でプロトタイプ作成されました。開発者自身は点字や SignWriting をまだ読めないため、視覚障害・盲ろう・ろうコミュニティの皆さまからのテスト・フィードバック・共同リーダーシップを歓迎します。

## アクセシビリティ機能
- **スクリーンリーダー・キーボード操作:** `Alt+1`–`Alt+4` でモジュール切替、`Alt+E` で編集コンソールへ移動、`ArrowLeft`/`ArrowRight`/`Home`/`End` でノードやハッシュリングを走査、`?` でショートカット一覧、`aria-live` 通知。
- **点字（入出力）:** 40セル **Braille** バッファ（**Show Dots** で Unicode 点字 `⠁`–`⠿` 表示）および 6点パーキンス入力（`F D S` / `J K L`）。
- **触手話（Protactile / PT）:** 音声非依存、**High Contrast** 表示、空間コンタクトゾーン（`Zone A/B/C`）、触覚パターン（**Pulse Haptics**）。
- **手話・SignWriting:** **ASL** および **SignWriting**（`FSW`、`Unicode SWU`、2D SVG サインボックス）に対応。日本手話（`JSL` · SOV 語順）を含む各国手話および任意のカスタム手話をサポート。

## セットアップ
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
本番ビルド: `npm run build && npm run preview`
*(現在はブラウザのメモリ上でのみ動作し、永続化やセキュリティ監査は今後の課題です。)*
