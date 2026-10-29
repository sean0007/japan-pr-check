export const SITE_NAME = "Japan PR Guideline Check";

export const SITE_TAGLINE =
  "Japan revised its permanent residence (永住) guideline on October 1, 2026. Your filing date decides which rules apply: until March 31, 2027 most of the old rules still count (spouses: 3 years of marriage + 1 year in Japan, a 3-year visa counts), but the stricter household-income rule already applies. From April 1, 2027: spouses need 5 + 3 years, intra-company transferee years stop counting, and no trip abroad of 6+ months or 2.5 years in total. Check your dates.";

export const DISCLAIMER_SHORT = "Educational guide to ISA's published guidelines, not immigration or legal advice. Permanent residence is discretionary; ISA decides and does not publish its income thresholds.";

export const HONESTY =
  "Rules as of 2026-10-18 from ISA's permanent residence guideline (revised 2026-10-01), the 2026-02-24 guideline and ISA's 2026-10-01 notice on which version applies. Not affiliated with ISA or the Ministry of Justice.";

export const SIBLING_TOOLS = [
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening (JPETS)" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://japan-dual-pricing.vercel.app", label: "Japan Dual Pricing" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-overseas-dependents.vercel.app", label: "Japan Overseas Dependents Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan International Postage 2027" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-pr-check.vercel.app";
}
