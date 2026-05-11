// Conversation data — sample threads & turns
const CONVERSATIONS = [
  { id: "c1", title: "C# SqlConnection 예외 처리", agents: ["haiku","flash","deepseek"], time: "방금" },
  { id: "c2", title: "Postgres vs DynamoDB 트레이드오프", agents: ["sonnet","gpt","gemini"], time: "12분" },
  { id: "c3", title: "RAG 파이프라인 임베딩 모델 선택", agents: ["opus","sonar","gemini"], time: "1시간" },
  { id: "c4", title: "K8s 무중단 배포 — 카나리 vs 블루그린", agents: ["sonnet","gpt","deepseek","flash"], time: "어제" },
  { id: "c5", title: "Rust async 런타임 비교 (tokio/smol)", agents: ["o1","deepseek","gpt"], time: "어제" },
  { id: "c6", title: "디자인 토큰 명명 규약", agents: ["sonnet","opus"], time: "2일" },
  { id: "c7", title: "Webhook idempotency 패턴", agents: ["gpt","sonnet","sonar"], time: "3일" },
];

// The active thread — mirrors the screenshot's intent
const QUESTION = "안녕하세요! 현재 C# 코드에서 데이터베이스 연결 부분의 예외 처리가 미흡한 것 같아요. `SqlConnection`을 사용하는 `GetUserAsync()` 메서드에 try-catch 블록을 추가하고, 연결이 끊겼을 때 자동으로 재시도하는 로직도 넣어주실 수 있을까요?";

const TURNS = [
  // Round 1
  { round: 1, label: "분석 · 디스패치", agent: "sonnet", role: "lead", time: "00:01.2",
    text: "요청을 확인했습니다. 각 에이전트에 역할을 분배합니다.\n· Flash → 예외 구조 분석\n· DeepSeek → 재시도 패턴 설계\n· o3 → 성능 영향 평가" },
  // Round 2
  { round: 2, label: "병렬 토론", agent: "flash", time: "00:02.8",
    text: "`GetUserAsync()` 내부를 확인했습니다. 현재 `SqlException` 처리 로직이 전혀 없습니다. `try-catch(SqlException ex)` 블록을 추가해 DB 연결 오류를 명시적으로 핸들링하는 구조가 필요합니다." },
  { round: 2, agent: "deepseek", time: "00:03.1",
    text: "재시도 패턴은 지수 백오프(Exponential Backoff) 방식으로 설계하겠습니다. 최대 3회 재시도, 각 대기 시간은 `2^attempt * baseMs`로 증가합니다. `MaxRetries = 3` 상수로 클래스 레벨에 선언합니다." },
  { round: 2, agent: "o1", role: "dissent", time: "00:03.4",
    text: "재시도 루프 내 `Task.Delay()`는 스레드 블로킹 없이 비동기로 처리되므로 성능 영향은 최소화됩니다. 다만, 타임아웃 설정을 명시하지 않으면 무한 대기를 방지할 수 없습니다. `CancellationToken`을 인자로 받도록 시그니처를 변경해 주세요." },
  { round: 2, agent: "deepseek", role: "agree", time: "00:04.0",
    text: "동의합니다. `CancellationToken`을 추가하고 `Task.Delay(delay, ct)`로 전달하겠습니다. `attempt >= MaxRetries` 조건에서 예외를 다시 `throw`해 호출자가 최종 흐름을 처리할 수 있도록 합니다." },
  { round: 2, agent: "flash", role: "agree", time: "00:04.3",
    text: "DeepSeek의 지수 백오프 제안에 동의합니다. 추가로 `using` 블록과 함께 구성해 `SqlConnection` 리소스 누수도 함께 방지합니다." },
  // Round 3
  { round: 3, label: "합의 · 합성", agent: "sonnet", role: "lead", time: "00:05.1",
    text: "분석 완료. 세 에이전트의 검토를 합쳐 최종 수정안을 적용했습니다. `GetUserAsync()` 메서드에 `SqlException` try-catch와 최대 3회 지수 백오프 재시도 로직, `CancellationToken` 지원이 추가되었습니다. 우측 에디터에서 변경 사항을 확인하고 수락 또는 거절해 주세요." },
];

Object.assign(window, { CONVERSATIONS, QUESTION, TURNS });
