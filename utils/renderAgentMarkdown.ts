// utils/renderAgentMarkdown.ts

type Slug = "smart-sourcer" | "email-ghostwriter";

// ─────────────────────────────────────────────
// 타입 정의 (필요 최소만)
// ─────────────────────────────────────────────

interface ProductSpec {
  [key: string]: string | string[];
}

interface ProductAnalysis {
  brand: string;
  model_name: string;
  price_krw: number;
  specs: ProductSpec;
  pros: string[];
  cons: string[];
  value_score: number;
  fitness_score: number;
  overall_score: number;
  one_line_review: string;
  source_urls: string[];
}

interface Recommendation {
  rank: number;
  model_name: string;
  reason: string;
}

interface BuyingTip {
  where_to_buy: string[];
  discount_info: string;
  cautions: string[];
}

interface SmartSourcerResult {
  request_summary: string;
  search_conditions: Record<string, string>;
  products: ProductAnalysis[];
  top3: Recommendation[];
  final_pick: Recommendation;
  buying_tips: BuyingTip;
  generated_at: string;
}

interface DraftVersion {
  tone: string;
  subject: string;
  body: string;
  key_points: string[];
}

interface EmailReplyPlan {
  original_subject: string;
  from_address: string;
  summary: string;
  intent: string;
  urgency: string;
  drafts: DraftVersion[];
}

interface GhostwriterResult {
  total_unread: number;
  filter_query: string;
  replies: EmailReplyPlan[];
  generated_at: string;
}

// ─────────────────────────────────────────────
// 메인 엔트리
// ─────────────────────────────────────────────

export function renderAgentMarkdown(
  result: unknown,
  slug: Slug
): string {
  if (!result || typeof result !== "object") {
    return "결과가 없습니다.";
  }

  if (slug === "smart-sourcer") {
    return renderSmartSourcerMarkdown(result as SmartSourcerResult);
  }

  if (slug === "email-ghostwriter") {
    return renderGhostwriterMarkdown(result as GhostwriterResult);
  }

  return "지원되지 않는 에이전트입니다.";
}

// ─────────────────────────────────────────────
// Smart Sourcer → Markdown
// ─────────────────────────────────────────────

function renderSmartSourcerMarkdown(r: SmartSourcerResult): string {
  let md: string[] = [];

  md.push(`# 🔍 상품 비교 분석 리포트`);
  md.push(``);
  md.push(`> ${r.request_summary}`);
  md.push(``);

  if (r.generated_at) {
    md.push(`_생성 시각: ${formatDate(r.generated_at)}_`);
    md.push(``);
  }

  // 검색 조건
  if (r.search_conditions && Object.keys(r.search_conditions).length > 0) {
    md.push(`## 🏷 검색 조건`);
    Object.entries(r.search_conditions).forEach(([k, v]) => {
      md.push(`- **${k}**: ${v}`);
    });
    md.push(``);
  }

  // Final Pick
  if (r.final_pick) {
    md.push(`## 🏆 최종 추천`);
    md.push(`**${r.final_pick.model_name}**`);
    md.push(``);
    md.push(`- ${r.final_pick.reason}`);
    md.push(``);
  }

  // TOP 3
  if (r.top3?.length) {
    md.push(`## 🥇 TOP 3`);
    r.top3.forEach(t => {
      md.push(`${t.rank}. **${t.model_name}**`);
      md.push(`   - ${t.reason}`);
    });
    md.push(``);
  }

  // 제품 상세
  if (r.products?.length) {
    md.push(`## 📦 제품 상세 비교`);
    md.push(``);

    r.products.forEach(p => {
      md.push(`### ${p.brand} ${p.model_name}`);
      md.push(`- 가격: ${formatPrice(p.price_krw)}`);
      md.push(`- 종합: **${p.overall_score}** / 가성비: ${p.value_score} / 적합도: ${p.fitness_score}`);
      md.push(``);
      md.push(`> "${p.one_line_review}"`);
      md.push(``);

      // 사양
      if (p.specs) {
        md.push(`**사양**`);
        Object.entries(p.specs).forEach(([k, v]) => {
          const value = Array.isArray(v) ? v.join(", ") : v;
          md.push(`- ${k}: ${value}`);
        });
        md.push(``);
      }

      if (p.pros?.length) {
        md.push(`**장점**`);
        p.pros.forEach(x => md.push(`- ✅ ${x}`));
        md.push(``);
      }

      if (p.cons?.length) {
        md.push(`**단점**`);
        p.cons.forEach(x => md.push(`- ❌ ${x}`));
        md.push(``);
      }

      if (p.source_urls?.length) {
        md.push(`**출처**`);
        p.source_urls.forEach(u => {
          md.push(`- [링크](${u})`);
        });
        md.push(``);
      }

      md.push(`---`);
      md.push(``);
    });
  }

  // 구매 팁
  if (r.buying_tips) {
    md.push(`## 💡 구매 팁`);
    md.push(``);

    if (r.buying_tips.where_to_buy?.length) {
      md.push(`**추천 구매처**`);
      r.buying_tips.where_to_buy.forEach(x => md.push(`- ${x}`));
      md.push(``);
    }

    if (r.buying_tips.discount_info) {
      md.push(`**할인/프로모션**`);
      md.push(`${r.buying_tips.discount_info}`);
      md.push(``);
    }

    if (r.buying_tips.cautions?.length) {
      md.push(`**주의사항**`);
      r.buying_tips.cautions.forEach(x => md.push(`- ⚠ ${x}`));
      md.push(``);
    }
  }

  return md.join("\n");
}

// ─────────────────────────────────────────────
// Email Ghostwriter → Markdown
// ─────────────────────────────────────────────

function renderGhostwriterMarkdown(r: GhostwriterResult): string {
  let md: string[] = [];

  md.push(`# 📧 이메일 답장 초안 리포트`);
  md.push(``);
  md.push(`- 분석 메일 수: **${r.total_unread}통**`);

  if (r.filter_query) {
    md.push(`- 필터: \`${r.filter_query}\``);
  }

  if (r.generated_at) {
    md.push(`- 생성 시각: ${formatDate(r.generated_at)}`);
  }

  md.push(``);

  if (!r.replies?.length) {
    md.push(`📭 분석할 메일이 없습니다.`);
    return md.join("\n");
  }

  r.replies.forEach((reply, idx) => {
    md.push(`## ${idx + 1}. ${reply.original_subject}`);
    md.push(``);
    md.push(`- From: ${reply.from_address}`);
    md.push(`- 긴급도: **${reply.urgency}**`);
    md.push(`- 의도: ${reply.intent}`);
    md.push(``);
    md.push(`**요약**`);
    md.push(`> ${reply.summary}`);
    md.push(``);

    reply.drafts?.forEach((d, i) => {
      md.push(`### ✍️ 초안 ${i + 1} (${d.tone})`);
      md.push(``);
      md.push(`**제목:** ${d.subject}`);
      md.push(``);
      md.push(d.body);
      md.push(``);

      if (d.key_points?.length) {
        md.push(`**핵심 포인트**`);
        d.key_points.forEach(p => md.push(`- ${p}`));
        md.push(``);
      }
    });

    md.push(`---`);
    md.push(``);
  });

  return md.join("\n");
}

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}