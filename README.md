# 박민우 팀장 텔레그램 챗봇 - 배포 가이드

카카오톡 3,788개 발화 + 인비절라인 공식 교육자료를 학습한 박민우 팀장 챗봇을
텔레그램에서 사용할 수 있게 만드는 서버입니다.

## 준비물 체크리스트

- [ ] 텔레그램 Bot Token (@BotFather에서 발급)
- [ ] Anthropic API Key (console.anthropic.com에서 발급)
- [ ] GitHub 계정 (Railway 가입용)
- [ ] Railway 계정 (무료)

---

## 1단계. 텔레그램 봇 만들기

1. 텔레그램 앱에서 **@BotFather** 검색 → 대화 시작
2. `/newbot` 입력
3. 봇 이름 입력 (예: 박민우 팀장)
4. 봇 username 입력 (예: minwoo_invisalign_bot → 반드시 끝에 bot)
5. 받은 **토큰**을 복사해서 저장
   (형태: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## 2단계. Anthropic API 키 발급

1. https://console.anthropic.com 접속 → 로그인/가입
2. 좌측 메뉴 **API Keys** → **Create Key**
3. 키 이름 입력 후 생성 → 복사해서 저장 (재확인 불가하니 꼭 저장!)
4. **Billing** 메뉴에서 카드 등록 + 소액 충전 ($5~10이면 충분)

---

## 3단계. GitHub에 코드 업로드

1. github.com에서 새 저장소(Repository) 생성 (예: minwoo-telegram-bot)
2. 이 폴더(`server.js`, `package.json`)의 내용을 그 저장소에 업로드
   - GitHub 웹사이트에서 "Add file → Upload files"로 두 파일을
     드래그해서 올리면 끝 (Git 명령어 몰라도 가능)

---

## 4단계. Railway로 배포

1. https://railway.app 접속 → GitHub 계정으로 가입/로그인
2. **New Project** → **Deploy from GitHub repo** 선택
3. 방금 만든 저장소(minwoo-telegram-bot) 선택
4. 자동으로 빌드가 시작됨 (Node.js 감지)
5. 배포된 프로젝트 클릭 → **Variables** 탭에서 환경변수 3개 추가:
   - `TELEGRAM_TOKEN` = 1단계에서 받은 토큰
   - `ANTHROPIC_API_KEY` = 2단계에서 받은 키
   - `WEBHOOK_URL` = (잠시 비워두고 다음 단계 먼저 진행)
6. **Settings** 탭 → **Networking** → **Generate Domain** 클릭
   → `https://xxxx.up.railway.app` 같은 주소가 생성됨
7. 생성된 주소를 복사해서 `WEBHOOK_URL` 환경변수에 붙여넣기
   (마지막에 슬래시 `/` 붙이지 않기)
8. 저장하면 서버가 자동으로 재시작되며 webhook이 등록됨

---

## 5단계. 테스트

1. 텔레그램에서 내가 만든 봇 검색 (username으로)
2. `/start` 입력 → 박민우 팀장 인사말이 오는지 확인
3. "인비절라인 장치 배송 얼마나 걸려요?" 같은 질문 테스트

---

## 사용 가능한 명령어

- `/start` : 봇 시작 (대화 초기화 + 인사말)
- `/reset` : 대화 기록 초기화 (새 대화 시작)

---

## 비용 참고사항

- Railway: 매월 일정 무료 크레딧 제공 (소규모 사용은 무료 범위 내 가능)
- Anthropic API: 메시지 사용량만큼 과금 (질문/답변 길이에 따라 다름,
  일반적인 대화 1건당 약 1~3원 수준)

## 문제 해결

- 봇이 응답하지 않으면: Railway 프로젝트의 **Deployments** 탭에서
  로그를 확인해 에러 메시지를 확인하세요.
- "Webhook 등록 실패"가 보이면: WEBHOOK_URL이 정확한지,
  마지막에 `/`가 없는지 확인하세요.
