import { Link } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import s from "./LandingPage.module.css";
import ms from "../layouts/MarketingLayout.module.css";

const MODELS = [
  { name: "Claude 4 Opus", color: "oklch(0.7 0.15 30)" },
  { name: "GPT-5", color: "oklch(0.75 0.16 145)" },
  { name: "Gemini 3 Pro", color: "oklch(0.74 0.16 250)" },
  { name: "DeepSeek V3", color: "oklch(0.7 0.18 290)" },
  { name: "Mistral Large 2", color: "oklch(0.8 0.16 60)" },
  { name: "Grok 3", color: "oklch(0.7 0.18 10)" },
  { name: "Llama 4", color: "oklch(0.72 0.13 200)" },
];

const HOW_STEPS = [
  { title: "질문을 라우팅합니다", desc: "주제·복잡도·언어를 분석해, 강점이 다른 3~5개 모델을 자동으로 호출합니다.", tech: "routing → claude · gpt · gemini · deepseek" },
  { title: "모델끼리 토론합니다", desc: "각 모델이 의견을 내고, 다른 모델의 답을 읽고 반박·동의·보완합니다. 최대 3라운드.", tech: "debate · 2~3 rounds · dissent surfaced" },
  { title: "최종 답을 합성합니다", desc: "Lead 모델이 토론 전체를 읽고 단 하나의 답으로 통합 — 합의 점수와 함께 반환합니다.", tech: "synthesize · consensus score · cited" },
];

const BAD_ITEMS = [
  "이 모델의 환각·편향이 그대로 답에 반영됨",
  "출처·근거의 사각지대를 사용자가 직접 검증해야 함",
  "모델이 자신의 약점을 거의 알려주지 않음",
  "여러 모델을 직접 켜고 끄며 비교 — 시간 낭비",
  "중요한 의사결정에 \"참고용\"으로만 쓰게 됨",
];

const GOOD_ITEMS = [
  "모델 간 교차검증으로 환각이 자동으로 드러남",
  "합의 점수로 답의 신뢰도를 한눈에 파악",
  "의견 충돌(반대 의견)이 항상 표면에 노출됨",
  "한 번의 질문 · 한 곳의 UI에서 종결",
  "실제 결정에 쓸 수 있는 신뢰도",
];

const METRICS = [
  { val: "+", accent: "17.4%", lbl: "단일 모델 대비 정확도", src: "vs. 최고 단일 모델 평균" },
  { val: "", accent: "−63%", lbl: "환각률 감소", src: "사실 검증 벤치마크" },
  { val: "", accent: "92%", lbl: "사용자 신뢰도", src: "n=842, 5점 척도 4+ 비율" },
  { val: "", accent: "3.4초", lbl: "평균 응답 시간", src: "3-agent · 2 rounds" },
];

const TESTIMONIALS = [
  { text: "법률 자문 초안을 쓸 때 가장 무서운 건 \"그럴듯한 거짓말\"입니다. HELIX의 반대 의견 패널이 그걸 잡아줍니다.", initials: "SK", name: "김선영", role: "변호사 · 법무법인 K" },
  { text: "제품 의사결정 회의에서 \"Claude는 이렇게 봤고, GPT는 다르게 봤어\"라고 말할 수 있는 게 진짜 큰 변화입니다.", initials: "JL", name: "이지훈", role: "Product Lead · 핀테크" },
  { text: "API 한 번으로 3개 모델 합의를 받습니다. 자체 라우터 만들 시간 아꼈고, 합의 점수가 그대로 우리 UI에 들어갑니다.", initials: "MP", name: "박민호", role: "CTO · AI 헬스케어" },
];

const FAQ_ITEMS = [
  { q: "여러 모델을 부른다면, 비용도 N배인가요?", a: "아닙니다. Pro 플랜에는 월 300회의 합의 호출이 포함되며, 라우터가 자동으로 가벼운 모델 + 강한 Lead 모델 조합을 골라 평균 비용을 단일 GPT-4 호출의 1.4배 수준으로 유지합니다." },
  { q: "제 데이터로 모델을 학습시키나요?", a: "아니요. 모든 플랜에서 사용자 데이터는 모델 학습에 사용되지 않습니다. Enterprise는 데이터 보관 0일 옵션과 자체 키(BYOK) 모드를 제공합니다." },
  { q: "모델이 의견 일치를 못 보면 어떻게 되나요?", a: "합의 점수가 60% 미만이면 답을 강제로 통일하지 않고, \"분기된 답 A / B\" 형태로 양쪽 입장을 모두 보여드립니다. 결정은 항상 사용자 몫입니다." },
  { q: "API에서 어떤 모델을 쓸지 직접 지정할 수 있나요?", a: "네. agents: [\"claude-opus-4\", \"gpt-5\", \"deepseek-v3\"] 형태로 직접 지정하거나, \"auto\"로 라우터에 위임할 수 있습니다." },
  { q: "오프라인/온프레미스 배포가 가능한가요?", a: "Enterprise 플랜에서 AWS PrivateLink, Azure 전용 테넌트, 또는 자체 K8s 배포(Helm 차트)를 지원합니다. Llama 4 / Mistral 같은 오픈 모델로 풀리 폐쇄망 운영도 가능합니다." },
];

export function LandingPage() {
  const revealRef = useReveal();

  return (
    <div ref={revealRef}>
      {/* ── Hero ── */}
      <section className={s.hero}>
        <div className={s.heroEyebrow} data-reveal="fade" data-reveal-delay="100">
          <span className={s.heroTag}>v1.4</span>
          <span>Claude 4 · GPT-5 · Gemini 3 Pro · DeepSeek V3 합의 엔진</span>
        </div>
        <h1 data-reveal data-reveal-delay="200">혼자가 아닌,<br /><em>합의된 답을 주는 AI.</em></h1>
        <p data-reveal data-reveal-delay="350">
          HELIX는 서로 다른 LLM을 한 토론에 모아 교차검증·합의시키고, 그 과정을{" "}
          <strong style={{ color: "var(--fg)" }}>유리상자</strong>로 보여줍니다.
        </p>
        <div className={s.heroCta} data-reveal data-reveal-delay="500">
          <Link to="/login" className={ms.ctaPrimary}>14일 Pro 무료 시작 →</Link>
          <a href="#how" className={ms.ctaSecondary}>▷ 데모 보기</a>
        </div>
        <div className={s.heroMeta} data-reveal="fade" data-reveal-delay="650">
          <span>신용카드 불필요</span>
          <span className={s.dot} />
          <span>SOC 2 Type II</span>
          <span className={s.dot} />
          <span>1만+ 팀이 사용 중</span>
        </div>
      </section>

      {/* ── Model strip ── */}
      <div className={s.strip} data-reveal="fade" data-reveal-delay="100">
        <div className={s.stripLabel}>— 연결된 모델 —</div>
        <div className={s.stripModels}>
          {MODELS.map((m) => (
            <div key={m.name} className={s.modelBadge}>
              <span className={s.modelSwatch} style={{ background: m.color }} />
              {m.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── Demo ── */}
      <div className={s.demo} data-reveal="scale">
        <div className={s.demoFrame}>
          <div className={s.demoChrome}>
            <div className={s.demoDots}><span /><span /><span /></div>
            <div className={s.demoUrl}>helix.ai/chat/<span>SaaS-pricing-Q&amp;A</span></div>
          </div>
          <div className={s.demoBody}>
            <div className={s.dUser}>SaaS B2B 스타트업의 초기 가격 전략을 짜줘. 시드 단계, ACV 12K 목표.</div>

            <div className={s.dDiscuss}>
              <div className={s.dDiscussHead}>
                <span>4-agent · round 2/3</span>
                <span className={s.live}><span className={s.pulse} />LIVE</span>
              </div>

              <div className={s.dTurn}>
                <div className={s.dAv} style={{ background: "oklch(0.7 0.15 30)" }}>C</div>
                <div>
                  <div className={s.dHead}><b>Claude</b><span className={s.dMod}>Opus 4</span></div>
                  <div className={s.dBody}>밸류 메트릭을 시트 수가 아닌 <code>사용량(API call)</code>으로 잡는 게 ACV 확장에 유리합니다.</div>
                </div>
              </div>
              <div className={s.dTurn}>
                <div className={s.dAv} style={{ background: "oklch(0.75 0.16 145)" }}>G</div>
                <div>
                  <div className={s.dHead}><b>GPT-5</b><span className={s.dMod}>openai</span></div>
                  <div className={s.dBody}>동의. 다만 시드 단계엔 측정 인프라가 부담 → <strong style={{ color: "var(--fg)" }}>하이브리드</strong>(시트 + 사용량 캡)를 권장.</div>
                </div>
              </div>
              <div className={s.dTurn}>
                <div className={s.dAv} style={{ background: "oklch(0.74 0.16 250)" }}>M</div>
                <div>
                  <div className={s.dHead}><b>Gemini</b><span className={s.dMod}>3 Pro</span></div>
                  <div className={s.dBody}>3-티어 구조에 design partner 할인 50%를 첫 6개월 한정으로 적용. 레퍼런스 확보 → PLG 전환 신호.</div>
                </div>
              </div>
            </div>

            <div className={s.dFinal}>
              <span className={s.dBadge}>★ Consensus</span>
              <div className={s.dText}>3-티어 하이브리드 가격 · 시트 베이스 + 사용량 캡 · design partner 50% 할인 (6mo).</div>
              <span className={s.dScore}>합의 92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <section className={s.section} id="how">
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— 작동 방식 —</div>
          <h2>3단계로 합의된 답을 만듭니다.</h2>
          <p>한 모델의 환각, 한 모델의 편향, 한 모델의 사각지대 — HELIX는 토론으로 이를 상쇄합니다.</p>
        </div>
        <div className={s.grid3}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} className={s.card} data-reveal data-reveal-delay={String(i * 120)}>
              <div className={s.cardNum}>{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className={s.cardTech}>{step.tech}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className={s.sectionNoPadTop}>
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— 왜 한 모델만으론 부족한가 —</div>
          <h2>같은 질문, 세 가지 다른 답.</h2>
          <p>최신 벤치마크에서도 모델마다 정확도, 추론 스타일, 편향이 다릅니다. 중요한 결정에 한 모델만 쓰면 그 사각지대를 그대로 떠안게 됩니다.</p>
        </div>
        <div className={s.compare}>
          <div className={s.compareCardBad} data-reveal="slide-left">
            <h4><span className={s.pipBad} />단일 모델 사용 시</h4>
            <div className={s.compareList}>
              {BAD_ITEMS.map((item, i) => (
                <div key={i} className={s.compareRow}><div className={s.compareIco}>×</div><div>{item}</div></div>
              ))}
            </div>
          </div>
          <div className={s.compareCardGood} data-reveal="slide-right">
            <h4><span className={s.pipGood} />HELIX 사용 시</h4>
            <div className={s.compareList}>
              {GOOD_ITEMS.map((item, i) => (
                <div key={i} className={s.compareRow}><div className={s.compareIcoGood}>✓</div><div>{item}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={s.section} id="features">
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— 핵심 기능 —</div>
          <h2>토론을 보이게 만든 첫 AI 인터페이스.</h2>
        </div>

        {/* Feature 1: Round-table */}
        <div className={s.feat} data-reveal>
          <div className={s.featText}>
            <div className={s.featLabel}>01 · Round-table Routing</div>
            <h3>질문에 맞는 모델 조합을 자동으로 구성합니다</h3>
            <p>코드는 Claude + DeepSeek, 한국어 비즈니스 글쓰기는 GPT + Gemini, 멀티모달은 Gemini + GPT — 라우터가 토픽·언어·복잡도를 보고 결정합니다.</p>
            <ul className={s.featList}>
              <li>7개 모델 풀에서 매 질문마다 최적 조합 선택</li>
              <li>수동 오버라이드 가능 (Pro 이상)</li>
              <li>모델 호출 로그 100% 투명 공개</li>
            </ul>
          </div>
          <div className={s.featVisual}>
            <div className={s.visRound}>
              <div className={s.visRoundCenter}>
                <span style={{ fontSize: 9 }}>routed to</span>
                <b>4</b>
                <span style={{ fontSize: 8 }}>agents</span>
              </div>
              <div className={`${s.visNode} ${s.n1}`} style={{ borderColor: "var(--accent-line)", color: "var(--accent)" }}>Claude</div>
              <div className={`${s.visNode} ${s.n2}`}>GPT-5</div>
              <div className={`${s.visNode} ${s.n3}`}>Gemini</div>
              <div className={`${s.visNode} ${s.n4}`}>DeepSeek</div>
            </div>
          </div>
        </div>

        {/* Feature 2: Glass Box */}
        <div className={s.featReverse} data-reveal>
          <div className={s.featText}>
            <div className={s.featLabel}>02 · Glass Box</div>
            <h3>모델끼리 무슨 대화를 했는지 다 보여드립니다</h3>
            <p>최종 답 위에 접힌 "Glass Box" — 펼치면 누가 무엇을 말했고, 누가 동의했고, 누가 반대했는지가 그대로 보입니다. 블랙박스 없는 AI.</p>
            <ul className={s.featList}>
              <li>라운드별 발언 · 역할(Lead/Agree/Dissent) 태깅</li>
              <li>합의 점수 · 토큰 사용량 · 응답 시간 표시</li>
              <li>특정 모델 의견에만 follow-up 질문 가능</li>
            </ul>
          </div>
          <div className={s.featVisual}>
            <div className={s.visGlass}>
              <div className={s.visGlassHead}>
                <span>discussion</span>
                <span className={s.visGlassLead}>consensus 92%</span>
              </div>
              {[
                { bg: "oklch(0.7 0.15 30)", letter: "C", name: "Claude", text: "밸류 메트릭은 사용량 기반…", tag: "LEAD" },
                { bg: "oklch(0.75 0.16 145)", letter: "G", name: "GPT-5", text: "동의. 다만 측정 인프라…", tag: "AGREE" },
                { bg: "oklch(0.74 0.16 250)", letter: "M", name: "Gemini", text: "3-티어 + 디자인 파트너…", tag: "EXTEND" },
                { bg: "oklch(0.7 0.18 290)", letter: "D", name: "DeepSeek", text: "시드엔 단순한 2-티어가…", tag: "DISSENT" },
              ].map((row) => (
                <div key={row.letter} className={s.visGlassRow}>
                  <div className={s.visGlassAv} style={{ background: row.bg }}>{row.letter}</div>
                  <div className={s.visGlassBody}><b>{row.name}</b>{row.text}</div>
                  <div className={row.tag === "DISSENT" ? s.visGlassTagDissent : s.visGlassTag}>{row.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 3: Developer API */}
        <div className={s.feat} data-reveal>
          <div className={s.featText}>
            <div className={s.featLabel}>03 · Developer API</div>
            <h3>당신의 앱 안에서도 합의된 답을 받으세요</h3>
            <p>한 줄의 API로 다중 모델 토론을 호출합니다. 응답에는 합의 점수와 각 모델의 발언이 그대로 포함되어, 앱에서 신뢰도 UI를 직접 그릴 수 있습니다.</p>
            <ul className={s.featList}>
              <li>OpenAI 호환 엔드포인트</li>
              <li>스트리밍 · 함수 호출 · JSON 모드 지원</li>
              <li>SOC 2 · GDPR · 데이터 보관 0일 옵션</li>
            </ul>
          </div>
          <div className={s.featVisual}>
            <div className={s.visCode}>
              <div className={s.visCodeBar}>POST https://api.helix.ai/v1/consensus</div>
              <pre>
                <span className={s.cc}>{"// 한 번의 호출, N개 모델의 합의"}</span>{"\n"}
                <span className={s.ck}>const</span>{" r = "}<span className={s.ck}>await</span>{" helix.consensus({\n"}
                {"  prompt: "}<span className={s.cs}>{'"가격 전략을 짜줘"'}</span>{",\n"}
                {"  agents: ["}<span className={s.cs}>{'"claude"'}</span>{", "}<span className={s.cs}>{'"gpt"'}</span>{", "}<span className={s.cs}>{'"gemini"'}</span>{"],\n"}
                {"  rounds: "}<span className={s.cn}>3</span>{",\n"}
                {"  glass_box: "}<span className={s.ck}>true</span>{"\n"}
                {"});\n\n"}
                {"console.log(r.answer);\n"}
                {"console.log(r.consensus_score);  "}<span className={s.cc}>{"// 0.92"}</span>{"\n"}
                {"console.log(r.dissent);          "}<span className={s.cc}>{"// [{model, text}]"}</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className={s.sectionNoPadTop}>
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— 측정된 효과 —</div>
          <h2>토론은 단순한 비주얼이 아닙니다.</h2>
          <p>1,200건의 자체 벤치마크 (MMLU, GPQA, MATH, 한국어 KMMLU) 기준.</p>
        </div>
        <div className={s.metrics} data-reveal="scale">
          {METRICS.map((m, i) => (
            <div key={i} className={s.metric}>
              <div className={s.metricVal}>{m.val}<span>{m.accent}</span></div>
              <div className={s.metricLbl}>{m.lbl}</div>
              <div className={s.metricSrc}>{m.src}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={s.sectionNoPadTop}>
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— 실제 사용자 —</div>
          <h2>한 번 써본 뒤로는 단일 모델로 못 돌아가요.</h2>
        </div>
        <div className={s.quotes}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.initials} className={s.quote} data-reveal data-reveal-delay={String(i * 120)}>
              <p>{t.text}</p>
              <div className={s.quoteWho}>
                <div className={s.quoteAv}>{t.initials}</div>
                <div>
                  <div className={s.quoteName}>{t.name}</div>
                  <div className={s.quoteRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={s.section} id="faq">
        <div className={s.sectionTitle} data-reveal>
          <div className={s.sectionEyebrow}>— FAQ —</div>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className={s.faq} data-reveal>
          {FAQ_ITEMS.map((item, i) => (
            <details key={i} className={s.faqItem} open={i === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── End CTA ── */}
      <div className={s.endcta} data-reveal="scale">
        <div className={s.endctaInner}>
          <h2>한 모델의 답에 만족하지 마세요.</h2>
          <p>14일 Pro 무료 체험. 신용카드 불필요. 1분이면 첫 합의 답을 받습니다.</p>
          <div className={s.heroCta}>
            <Link to="/login" className={ms.ctaPrimary}>무료로 시작하기 →</Link>
            <Link to="/pricing" className={ms.ctaSecondary}>가격 보기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
