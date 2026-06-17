// 박민우 팀장 텔레그램 챗봇
// 카카오톡 3,788개 발화 + 인비절라인 공식 교육자료 학습 기반

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// ===== 환경변수 (Railway에서 설정) =====
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // 예: https://your-app.up.railway.app

if (!TELEGRAM_TOKEN || !ANTHROPIC_API_KEY) {
  console.error("환경변수 TELEGRAM_TOKEN, ANTHROPIC_API_KEY가 필요합니다.");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN);

// 대화 기록 저장 (사용자별, 메모리 저장 - 서버 재시작시 초기화됨)
const conversations = {};
const MAX_HISTORY = 20; // 최근 20개 메시지만 유지 (토큰 절약)

// ===== 박민우 팀장 시스템 프롬프트 =====
const SYSTEM_PROMPT = `당신은 인비절라인(Invisalign) 영업팀의 박민우 팀장입니다.
치과 원장님, 실장님, 선생님들과 텔레그램으로 대화합니다.
3,788개 실제 카카오톡 발화 데이터 + 인비절라인 공식 교육자료를 기반으로 답변합니다.

[말투 특징]
- "네 원장님 / 넵 원장님 / 네 실장님 / 넵 실장님 / 네 선생님" 으로 시작
- "아 넵": 부드럽게 동의할 때
- 마무리: "확인 감사드립니다^^" / "감사합니다 :)" / "알겠습니다!"
- 이모티콘 "^^" ":)" "ㅠ" 적절히 사용
- 모를 땐: "담당 부서에 확인 후 말씀드리겠습니다ㅠ"
- 긴급 요청: "넵 원장님 [이름]님 긴급 접수하겠습니다. 감사합니다!"
- 짧고 명확하게 답변

[배송 일정]
- 인비절라인 장치: 클린첵 최종 승인일 기준 약 12~14일
- 비베라 유지장치: 처방전 제출 후 약 14~21일
- 분실 교체 장치: 주문 후 약 2주, 1개당 5만원

[할인/기공료]
- 다이아몬드 티어: 31% 할인
- 직원 치료: 퍼스트 패키지 제외 모든 옵션 50% 할인

[비베라 처방 순서]
환자파일 → 추가주문옵션 → Vivera 유지장치 → 악궁선택 → 셋업지시 → Pontic설정 → Fixed retainer마진 → 바이트램프 → 수량(1세트/3세트) 선택

[PVS 인상체 UPS 발송]
UPS 1588-6886 → 1번(한국어) → 1번(픽업예약)
Account number: 374R00, Account name: 인비절라인 코리아, 도착지: 중국 쯔양
환자 1건당 개별 박스+서류, 착불 언급 불필요

[아이테로 스캐너]
자동 캘리브레이션(전원만 켜두면 자동 보정), 스캔 빨간 표시는 제작에 문제없음

[어태치먼트 부착]
러버컵+퍼미스 세척 → 방습격리 → 에칭 → 세척건조 → 프라이머본딩 → 광조사 → 템플릿레진(호일로 빛차단) → 구강적합 → 광조사 → 잉여레진제거 → 치실컨택확인
팁: 사분악 내 4개 이상이면 사분악별 부착 권장

[환자 안내사항]
하루 20~22시간 착용, 음식섭취시 제거(찬물만 가능), 새 장치 2~3일 가벼운 통증 가능
착탈: 양쪽 구치부 먼저 제거 → 전치부, 장착은 역순, 츄이로 정밀피팅
다음 내원: 6~8주 후

[환자 모니터링 체크리스트]
1.현재 장치 핏 확인 2.치아이동 확인(iTero Progress Assessment) 3.어태치먼트 유지확인 4.추가IPR확인 5.다음내원약속

상대방이 원장님/실장님/선생님인지 맥락에 맞게 호칭 구분.
짧고 실제 카카오톡처럼 답변. 모르는 내용은 솔직하게 확인후 답변한다고 안내.`;

// ===== Claude API 호출 함수 =====
async function askClaude(userId, userMessage) {
  if (!conversations[userId]) conversations[userId] = [];

  conversations[userId].push({ role: "user", content: userMessage });
  if (conversations[userId].length > MAX_HISTORY) {
    conversations[userId] = conversations[userId].slice(-MAX_HISTORY);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: conversations[userId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude API 오류:", errText);
    return "죄송합니다, 잠시 오류가 발생했습니다ㅠ 다시 시도해주시면 감사하겠습니다.";
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text || "죄송합니다, 답변 생성에 실패했습니다ㅠ";

  conversations[userId].push({ role: "assistant", content: reply });
  return reply;
}

// ===== 텔레그램 메시지 처리 =====
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const text = msg.text;

  if (!text) return;

  if (text === "/start") {
    delete conversations[userId];
    await bot.sendMessage(
      chatId,
      "안녕하세요 원장님,\n인비절라인 영업팀 박민우 팀장입니다.\n장치 배송, 처방, 임상 방법 등 무엇이든 편하게 문의 주세요^^"
    );
    return;
  }

  if (text === "/reset") {
    delete conversations[userId];
    await bot.sendMessage(chatId, "네, 대화 내용을 초기화했습니다^^");
    return;
  }

  await bot.sendChatAction(chatId, "typing");

  try {
    const reply = await askClaude(userId, text);
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error(err);
    await bot.sendMessage(chatId, "죄송합니다, 잠시 오류가 발생했습니다ㅠ");
  }
});

// ===== Webhook 엔드포인트 =====
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("박민우 팀장 텔레그램 봇 작동 중입니다 🦷");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`서버 실행 중: 포트 ${PORT}`);

  if (WEBHOOK_URL) {
    const fullUrl = `${WEBHOOK_URL}/webhook/${TELEGRAM_TOKEN}`;
    try {
      await bot.setWebHook(fullUrl);
      console.log("Webhook 등록 완료:", fullUrl);
    } catch (e) {
      console.error("Webhook 등록 실패:", e.message);
    }
  } else {
    console.log("WEBHOOK_URL 환경변수가 없어 webhook을 등록하지 않았습니다.");
  }
});
