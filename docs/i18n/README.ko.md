# 접근 가능한 Object-Capability 분산 그래프 편집기 (한국어)

**프로젝트:** Lattice · **저장소:** <https://github.com/coderextreme/OCG-DDS> · **문의:** `yottzumm@gmail.com`

이 애플리케이션은 AI의 도움으로 빠르게 제작되었습니다. 작성자는 아직 점자나 SignWriting을 읽지 못하므로 시각장애인, 시청각장애인(농맹인), 농인 커뮤니티의 테스트와 참여를 환영합니다.

## 접근성 지원
- **스크린 리더 및 키보드:** `Alt+1`–`Alt+4` 모듈 전환, `Alt+E` 편집 콘솔, `ArrowLeft`/`ArrowRight`/`Home`/`End` 탐색, `?` 단축키 안내 및 `aria-live` 알림.
- **점자 (입출력):** 40셀 **Braille** 버퍼(**Show Dots** `⠁`–`⠿`) 및 6점 퍼킨스 입력(`F D S` / `J K L`).
- **촉수어 (Protactile / PT):** 오디오 무의존 설계, **High Contrast** 모드, 접촉 공간(`Zone A/B/C`) 및 진동 패턴(**Pulse Haptics**).
- **수어 및 SignWriting:** **ASL** 및 **SignWriting**(`FSW`, `Unicode SWU`, 2D SVG) 지원 — 한국수어(`KSL`)를 포함한 모든 국제 수어 선택 및 사용자 지정 가능.

## 설치 및 실행
```bash
git clone https://github.com/coderextreme/OCG-DDS
cd OCG-DDS
npm install --package-lock-only --allow-remote=all
npm ci
npm run dev
```
*(현재 그래프 상태는 브라우저 메모리에만 유지되며 보안 검토가 필요합니다.)*
