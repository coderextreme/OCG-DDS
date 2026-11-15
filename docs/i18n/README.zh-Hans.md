# 无障碍对象能力分布式图编辑器（简体中文）

**项目：** Lattice · **仓库：** <https://github.com/coderextreme/OCG-DDS> · **联系：** `yottzumm@gmail.com`

本应用在 AI 协助下快速构建。作者目前尚未掌握盲文或手语书写（SignWriting），诚邀盲人、盲聋及聋人社群测试反馈或共同领导本项目。

## 无障碍支持
- **读屏与键盘：** `Alt+1`–`Alt+4` 切换模块、`Alt+E` 聚焦编辑控制台、`ArrowLeft`/`ArrowRight`/`Home`/`End` 线性遍历图与哈希环、`?` 打开快捷键指南及 `aria-live` 实时播报。
- **盲文（输入/输出）：** 40 单元 **Braille** 缓冲区（**Show Dots** 切换 Unicode 盲文 `⠁`–`⠿`）与 6 点珀金斯输入（`F D S` / `J K L`）。
- **触觉手语（Protactile / PT）：** 零音频依赖、**High Contrast** 高对比度模式、空间触觉锚点（`Zone A/B/C`）与振动节拍（**Pulse Haptics**）。
- **手语与 SignWriting：** 支持 **ASL** 标注及 **SignWriting**（`FSW`、`Unicode SWU`、2D SVG 手语框），内置 10 种国际手语并可自定义任意国际手语（如中国手语 `CSL`）。

## 本地运行
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
生产构建：`npm run build && npm run preview`
*(当前状态仅保存在浏览器内存中；代码尚需安全审计。)*
