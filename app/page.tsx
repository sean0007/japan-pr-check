import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RULES, SOURCES } from "@/lib/pr";
import { EXAMPLE_GENERAL, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Japan permanent residency check: 2026 revised PR guideline (spouse 3→5 years, Apr 1 2027 deadline)";
const description =
  "Free checker for Japan's permanent residence (永住) guideline revised Oct 1, 2026: which rules apply to your filing date, when you meet the time requirement, spouse 3+1 → 5+3 years, 3-year visa transition, 6-month / 2.5-year absence rule, Japanese B1, income and pension factors. Free JSON API for AI agents. Not legal advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan PR Guideline Check",
  alternateName: ["Japan permanent residency checker", "永住許可 ガイドライン 改定 チェック", "永住 申請 新ガイドライン 判定"],
  url: PUBLIC_URL,
  applicationCategory: "ReferenceApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description:
    "Unofficial, free checker for Japan's permanent residence guideline (revised 2026-10-01): applies the version that matches your filing date, the time-in-Japan requirement for each route, and the new factors (absences, B1 Japanese, pension, income, schooling), with a keyless JSON API. Educational guide, not immigration or legal advice.",
};

const faq: FaqItem[] = [
  {
    q: "What changed in Japan's permanent residence guideline on October 1, 2026?",
    a: "The Immigration Services Agency (ISA) published a revised 永住許可に関するガイドライン on October 1, 2026. For applications filed from April 1, 2027 it: raises the spouse route from 3 years of marriage + 1 year in Japan to 5 + 3 years, and the child route from 1 to 3 years; stops counting Intra-company Transferee (and some Designated Activities) years as work years; no longer treats a 3-year period of stay as the longest period (with a narrow transition); weighs a trip abroad of 6 months or more, or 2 years 6 months abroad in total, in the 10 years before filing; adds Japanese at CEFR B1, understanding of Japan's rules, a pension-adequacy check and school attendance of children. The household-income test (above the average Japanese household of the same size) already applies to filings from April 1, 2026.",
  },
  {
    q: "Which rules apply to my application?",
    a: "ISA's October 1, 2026 notice splits applications by the date ISA receives them: before April 1, 2026 → the 2026-02-24 guideline; April 1, 2026 to March 31, 2027 → the 2026-02-24 guideline plus the revised income rule (2(4)(2)) and public-burden rule (2(5)(7)); from April 1, 2027 → the revised guideline in full. The decision date does not matter, only the filing date.",
  },
  {
    q: "Should spouses of Japanese nationals apply before March 31, 2027?",
    a: "If you already meet the old rule (3 years of real marriage and 1 year living in Japan) and your other factors are in order, filing by March 31, 2027 keeps you under the old time requirement; from April 1, 2027 you need 5 years of marriage and 3 years in Japan. The checker shows both earliest dates. It cannot tell you whether to apply: permission is discretionary and ISA looks at the whole picture.",
  },
  {
    q: "Does a 3-year visa still count as the longest period of stay?",
    a: "For filings up to March 31, 2027, yes: a 3-year period counts as the longest. From April 1, 2027, it counts only if you held it on March 31, 2027, the PR application is the first you file from April 1, 2027, and ISA decides before that 3-year period expires. Otherwise you need the actual longest period for your status (usually 5 years).",
  },
  {
    q: "How long can I be outside Japan and still get permanent residence?",
    a: "For filings from April 1, 2027, the revised guideline says that in the 10 years before filing, a single trip of 6 months or more, or a total of 2 years 6 months or more abroad, without a reasonable reason (such as an assignment abroad by a Japanese employer) is generally assessed negatively. ISA does not publish a day-count method; this tool treats 6 months as a calendar 6 months and 2 years 6 months as 913 days. Before April 1, 2027 these trips are judged case by case as continuity of residence.",
  },
  {
    q: "Do intra-company transferee years count toward permanent residence?",
    a: "Until March 31, 2027 they count as work years. For applications filed from April 1, 2027, Intra-company Transferee (企業内転勤) years no longer count toward the 5 years on a work status within the 10-year rule, and neither do Technical Intern Training, Employment for Skill Development, Specified Skilled Worker (i) or some Designated Activities.",
  },
  {
    q: "What income do I need for Japanese permanent residence?",
    a: "The revised guideline asks that your household income be above the average income of Japanese households of the same size, with a living-cost uplift for 5+ people and household size counting dependents abroad you support. ISA does not publish the figure (public-comment answers No. 17 and 34). Spouses and children of Japanese nationals or PRs, and recognized refugees, are exempt from this livelihood test but a household that is a public burden can still be assessed negatively. Treat any online ¥ figure as a guess.",
  },
  {
    q: "What is the Japanese B1 requirement for permanent residence?",
    a: "For filings from April 1, 2027, Japanese at CEFR B1 or above (the 2021 Reference Framework for Japanese Language Education) is a factor. Exempt: Highly Skilled Professionals and their families, people with 6+ years of schooling in Japan, and a PR's child born in Japan whose parent has B1. ISA will announce how it is tested before April 2027.",
  },
  {
    q: "How much does the permanent residence fee cost in 2026?",
    a: "¥200,000 for applications received from October 1, 2026 (was ¥10,000), paid with revenue stamps only when permission is granted. See the free Japan Visa Fee Calculator for every ISA fee.",
  },
  {
    q: "Can this tool tell me if I will get permanent residence?",
    a: "No. It only checks the objective, published parts of the guideline against your dates and answers. ISA decides with wide discretion, does not publish income or pension thresholds, and looks at your whole record (taxes, insurance, conduct, employer, family). For your case ask ISA or a licensed gyoseishoshi (行政書士) or lawyer.",
  },
  {
    q: "Is there a free API for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}/api/check (keyless, CORS open), all rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_permanent_residency_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "永住許可ガイドラインの改定はいつから適用されますか？",
    a: "2027年4月1日以降に受け付けた申請に改定後ガイドラインが全面適用されます。2026年4月1日〜2027年3月31日受付の申請は、改定前（2026年2月24日版）ガイドラインに、改定後の第2の4（2）収入と第2の5（7）公共の負担とならないことを加えて判断されます（出入国在留管理庁 2026年10月1日のお知らせ）。",
  },
  {
    q: "日本人の配偶者の永住要件はどう変わりますか？",
    a: "2027年3月31日受付分までは「実体を伴った婚姻生活が3年以上継続し、かつ引き続き1年以上本邦に在留」、2027年4月1日以降は「婚姻5年以上、かつ引き続き3年以上本邦に在留」です（実子等は1年→3年）。本ツールは両方の基準日を表示しますが、許可を保証するものではありません。",
  },
];

const bands = RULES.applicationBands as readonly { from?: string; to?: string; guideline?: string; [k: string]: unknown }[];

export default function HomePage() {
  const spouse = RULES.timeRequirements.filter((t) => ["general", "spouse", "child", "long_term_resident", "hsp70", "hsp80"].includes(t.route));
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 永住 · revised Oct 1 2026</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Japan permanent residency: which rules apply to you?</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-foreground sm:text-xl">PR guideline checker for the 2026 revision</p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Your filing date decides. Until March 31, 2027 most of the old rules still apply; from April 1, 2027 spouses need 5 + 3 years, intra-company transferee years stop counting, long trips abroad count against you and Japanese B1 becomes a factor. Enter your dates to see the version that applies, when you meet the time requirement, and which factors are open.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            spouse filing Feb 2027
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_GENERAL)}>
            10-year route with a 7-month trip
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-4xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Time in Japan: old vs revised</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Filed up to Mar 31, 2027</th>
                <th className="px-4 py-3 font-medium">Filed from Apr 1, 2027</th>
              </tr>
            </thead>
            <tbody>
              {spouse.map((t) => (
                <tr key={t.route} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-foreground">{t.label}</td>
                  <td className="px-4 py-3">{t.upTo20270331}</td>
                  <td className="px-4 py-3">{t.from20270401}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Filing-date bands ({bands.length}): before Apr 1, 2026 · Apr 1, 2026 – Mar 31, 2027 (old guideline + new income rule) · from Apr 1, 2027 (revised in full). New factors from Apr 1, 2027: {RULES.revisedFactors.join("; ")}.
        </p>
        <p className="mt-2 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 3).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://www.", "")}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href="/api/check?route=spouse&applicationDate=2027-02-15&residenceSince=2025-09-01&marriageDate=2023-06-10&periodOfStay=3y">
            /api/check?route=spouse&amp;applicationDate=2027-02-15&amp;residenceSince=2025-09-01&amp;marriageDate=2023-06-10&amp;periodOfStay=3y
          </a>
          . All rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_permanent_residency_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Japan PR guideline questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
