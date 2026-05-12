import { useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import s from "./PricingPage.module.css";

type Billing = "m" | "y";

interface TierData {
  name: string;
  nameLabel: string;
  title: string;
  desc: string;
  price: { m: string; y: string } | null;
  cur?: string;
  per: string;
  yearly: { m: string; y: string };
  cta: string;
  ctaHref: string;
  featured?: boolean;
  tag?: string;
  includesLabel: string;
  features: { text: string; bold?: string; dim?: boolean }[];
}

const TIERS: TierData[] = [
  {
    name: "free", nameLabel: "Free", title: "Starter",
    desc: "합의 엔진을 직접 써보기. 신용카드 없이.",
    price: { m: "₩0", y: "₩0" }, per: "/ 영원히",
    yearly: { m: " ", y: " " },
    cta: "무료로 시작", ctaHref: "/login", includesLabel: "포함",
    features: [
      { text: "합의 호출", bold: "월 20회" },
      { text: "2-agent 토론 (Claude + GPT)" },
      { text: "1라운드 고정" },
      { text: "Glass Box 펼쳐보기" },
      { text: "채팅 히스토리 7일 보관" },
      { text: "API 접근", dim: true },
      { text: "반대 의견 패널", dim: true },
    ],
  },
  {
    name: "pro", nameLabel: "Most popular", title: "Pro",
    desc: "개인 · 프리랜서 · 1인 사업자에 최적.",
    price: { m: "29,000", y: "23,200" }, cur: "₩", per: "/ 월",
    yearly: { m: " ", y: '<span>−20%</span> · 연 ₩278,400 (₩69,600 절약)' },
    cta: "14일 무료 체험 →", ctaHref: "/login", featured: true, tag: "★ 가장 인기",
    includesLabel: "Starter의 모든 기능 +",
    features: [
      { text: "합의 호출", bold: "월 300회" },
      { text: "토론 · 최대 3라운드", bold: "4-agent" },
      { text: "7개 모델 풀 (Claude · GPT · Gemini · DeepSeek · Mistral · Grok · Llama)" },
      { text: "반대 의견 패널 + 합의 점수" },
      { text: "모델 수동 선택 (오버라이드)" },
      { text: "채팅 히스토리 무제한" },
      { text: "파일 첨부 (PDF · 이미지 · 코드)" },
      { text: "이메일 지원" },
    ],
  },
  {
    name: "team", nameLabel: "Team", title: "Team",
    desc: "5~50인 팀의 협업 워크스페이스.",
    price: { m: "49,000", y: "39,200" }, cur: "₩", per: "/ 시트 · 월",
    yearly: { m: "최소 5시트", y: '<span>−20%</span> · 최소 5시트' },
    cta: "팀 시작하기 →", ctaHref: "/login", includesLabel: "Pro의 모든 기능 +",
    features: [
      { text: "합의 호출 (풀)", bold: "시트당 월 800회" },
      { text: "공유 채팅 + 댓글" },
      { text: "워크스페이스 프롬프트 라이브러리" },
      { text: "역할 기반 권한 (Admin/Editor/Viewer)" },
      { text: "SSO (Google · Microsoft)" },
      { text: "사용량 분석 대시보드" },
      { text: "API 접근 (월 5,000 호출)" },
      { text: "우선 지원 (24시간)" },
    ],
  },
  {
    name: "enterprise", nameLabel: "Custom", title: "Enterprise",
    desc: "대규모 조직 · 보안 · 자체 배포가 필요한 곳.",
    price: null, per: "",
    yearly: { m: "규모에 따라 협의", y: "규모에 따라 협의" },
    cta: "영업팀 문의 →", ctaHref: "mailto:sales@helix.ai", includesLabel: "Team의 모든 기능 +",
    features: [
      { text: "합의 호출", bold: "무제한" },
      { text: "SAML / SCIM SSO" },
      { text: "BYOK (자체 API 키 사용)" },
      { text: "데이터 보관 0일 옵션" },
      { text: "SOC 2 Type II · ISO 27001" },
      { text: "온프레미스 / VPC 배포" },
      { text: "전용 모델 라우팅 정책" },
      { text: "전담 CSM · 99.9% SLA" },
      { text: "법무 계약 · DPA · BAA" },
    ],
  },
];

const COMPARE_SECTIONS = [
  {
    label: "— 합의 엔진 —",
    rows: [
      { name: "월 합의 호출 한도", vals: ["20", "300", "800 / 시트", "무제한"] },
      { name: "동시 에이전트 수", vals: ["2", "4", "4", "5+"] },
      { name: "최대 토론 라운드", vals: ["1", "3", "3", "5"] },
      { name: "모델 수동 선택", vals: ["—", "✓", "✓", "✓"], ticks: [false, true, true, true] },
      { name: "반대 의견 패널", vals: ["—", "✓", "✓", "✓"], ticks: [false, true, true, true] },
    ],
  },
  {
    label: "— 협업 —",
    rows: [
      { name: "채팅 공유", vals: ["읽기 전용", "읽기 전용", "댓글 · 편집", "댓글 · 편집"] },
      { name: "프롬프트 라이브러리", vals: ["—", "개인", "워크스페이스", "워크스페이스"] },
      { name: "권한 관리 (RBAC)", vals: ["—", "—", "✓", "✓ 세분화"], ticks: [false, false, true, true] },
    ],
  },
  {
    label: "— 개발자 —",
    rows: [
      { name: "API 접근", vals: ["—", "—", "5K 호출 / 월", "무제한"] },
      { name: "웹훅 · 함수 호출", vals: ["—", "—", "✓", "✓"], ticks: [false, false, true, true] },
      { name: "BYOK (자체 키)", vals: ["—", "—", "—", "✓"], ticks: [false, false, false, true] },
    ],
  },
  {
    label: "— 보안 · 거버넌스 —",
    rows: [
      { name: "데이터 학습 사용", vals: ["사용 안 함", "사용 안 함", "사용 안 함", "사용 안 함"] },
      { name: "데이터 보관 기간", vals: ["7일", "30일", "90일 (설정)", "0일 옵션"] },
      { name: "SSO (SAML/SCIM)", vals: ["—", "—", "Google · MS", "SAML · SCIM"] },
      { name: "SOC 2 / ISO 27001", vals: ["✓", "✓", "✓", "✓ + 감사 보고서"], ticks: [true, true, true, true] },
      { name: "자체 배포 (VPC)", vals: ["—", "—", "—", "✓"], ticks: [false, false, false, true] },
    ],
  },
  {
    label: "— 지원 —",
    rows: [
      { name: "지원 채널", vals: ["커뮤니티", "이메일", "우선 (24h)", "전담 CSM"] },
      { name: "SLA", vals: ["—", "—", "99.5%", "99.9%"] },
    ],
  },
];

const FAQ = [
  { q: '"합의 호출"이 정확히 무엇인가요?', a: "한 번의 질문에 대해 여러 모델이 토론을 거쳐 합의된 답 하나를 만드는 작업 1건이 1회입니다. 라운드 수나 동시 에이전트 수와 관계없이 1건으로 계산합니다." },
  { q: "플랜은 언제든 변경할 수 있나요?", a: "네. 언제든 업그레이드 / 다운그레이드가 가능합니다. 다운그레이드 시 현재 결제 주기 종료까지는 상위 플랜이 유지됩니다." },
  { q: "학생 · 비영리 할인이 있나요?", a: "네. 학생 인증 시 Pro 50%, 등록 비영리단체는 Pro 무료입니다. hello@helix.ai로 연락해 주세요." },
  { q: "월 한도를 초과하면 어떻게 되나요?", a: "Pro / Team은 한도 초과 시 합의당 ₩120의 사용량 요금이 자동 부과됩니다 (월말 일괄 청구). 알림 기준은 설정에서 조정할 수 있습니다." },
  { q: "한국 원화로만 결제 가능한가요?", a: "아닙니다. USD / EUR / JPY 결제도 지원하며, 세금계산서 발행도 가능합니다. Enterprise는 송금(인보이스) 결제도 지원합니다." },
];

export function PricingPage() {
  const [billing, setBilling] = useState<Billing>("m");
  const revealRef = useReveal();

  return (
    <div ref={revealRef}>
      {/* ── Head ── */}
      <section className={s.headSection} data-reveal>
        <div className={s.headEyebrow}>— Pricing —</div>
        <h1>합의된 답에 비싸지 않은 가격을.</h1>
        <p>14일 Pro 무료 체험. 신용카드 불필요. 언제든 다운그레이드.</p>
        <div className={s.billing}>
          <button className={billing === "m" ? s.billingBtnOn : s.billingBtn} onClick={() => setBilling("m")}>월간 결제</button>
          <button className={billing === "y" ? s.billingBtnOn : s.billingBtn} onClick={() => setBilling("y")}>연간 결제 <span className={s.saveBadge}>−20%</span></button>
        </div>
      </section>

      {/* ── Tiers ── */}
      <section className={s.tiers}>
        {TIERS.map((t, i) => (
          <div key={t.name} className={t.featured ? s.tierFeatured : s.tier} data-reveal data-reveal-delay={String(i * 100)}>
            {t.tag && <span className={s.tierTag}>{t.tag}</span>}
            <div className={s.tierHead}>
              <div className={t.featured ? s.tierNameFeatured : s.tierName}>{t.nameLabel}</div>
              <h3>{t.title}</h3>
              <div className={s.tierDesc}>{t.desc}</div>
            </div>
            <div>
              <div className={s.tierPrice}>
                {t.price ? (
                  <>
                    {t.cur && <span className={s.tierCur}>{t.cur}</span>}
                    <span className={t.name === "free" ? s.tierAmountFree : s.tierAmount}>
                      {t.price[billing]}
                    </span>
                    <span className={s.tierPer}>{t.per}</span>
                  </>
                ) : (
                  <span className={s.tierContact}>맞춤 견적</span>
                )}
              </div>
              <div
                className={s.tierYearly}
                dangerouslySetInnerHTML={{ __html: t.yearly[billing] }}
              />
            </div>
            {t.ctaHref.startsWith("mailto") ? (
              <a href={t.ctaHref} className={t.featured ? s.tierCtaFeatured : s.tierCta}>{t.cta}</a>
            ) : (
              <Link to={t.ctaHref} className={t.featured ? s.tierCtaFeatured : s.tierCta}>{t.cta}</Link>
            )}
            <div className={s.tierDivider} />
            <div className={s.tierFeaturesLabel}>{t.includesLabel}</div>
            <ul>
              {t.features.map((f, i) => (
                <li key={i} className={f.dim ? s.featureDim : undefined}>
                  {f.bold ? <><b>{f.bold}</b> {f.text}</> : f.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── Compare table ── */}
      <section className={s.compareSection} data-reveal>
        <h2>기능 상세 비교</h2>
        <div className={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>기능</th>
                <th className={s.tierCol}>Starter</th>
                <th className={s.tierColFeatured}>Pro</th>
                <th className={s.tierCol}>Team</th>
                <th className={s.tierCol}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_SECTIONS.map((sec) => (
                <>
                  <tr key={sec.label} className={s.sectionRow}><td colSpan={5}>{sec.label}</td></tr>
                  {sec.rows.map((row) => (
                    <tr key={row.name}>
                      <td className={s.featName}>{row.name}</td>
                      {row.vals.map((v, i) => {
                        const isTick = row.ticks?.[i];
                        const isDash = v === "—";
                        const isFeaturedCol = i === 1;
                        const cls = [
                          s.center,
                          isTick ? s.centerTick : isDash ? s.centerDash : "",
                          isFeaturedCol ? s.centerFeatured : "",
                        ].filter(Boolean).join(" ");
                        return <td key={i} className={cls}>{v}</td>;
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={s.pfFaq} data-reveal>
        <h2>가격 관련 FAQ</h2>
        {FAQ.map((item, i) => (
          <details key={i} className={s.pfFaqItem} open={i === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      {/* ── End CTA ── */}
      <div className={s.endcta} data-reveal="scale">
        <div className={s.endctaInner}>
          <h2>먼저 써보세요. 가격은 그다음입니다.</h2>
          <p>14일간 모든 Pro 기능을 무료로. 마음에 들지 않으면 그냥 두시면 됩니다 — 자동 결제 없음.</p>
          <div className={s.ctas}>
            <Link to="/login" className={s.btnPri}>무료로 시작 →</Link>
            <a href="mailto:sales@helix.ai" className={s.btnSec}>영업팀과 대화</a>
          </div>
        </div>
      </div>
    </div>
  );
}
