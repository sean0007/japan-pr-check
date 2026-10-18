import { InputError, bool, num, type Endpoint, type Input } from "./agent-api";
import { B1_EXEMPTIONS, DISCLAIMER, PERIODS, ROUTES, RuleInputError, STATUSES, checkPr, todayJst, validDate, type B1Exemption, type Period, type Route, type Status, type Trip, type YesNo } from "./pr";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-pr-check.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?route=spouse&applicationDate=2027-02-15&residenceSince=2025-09-01&marriageDate=2023-06-10&periodOfStay=3y";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function has(v: unknown): boolean {
  const f = first(v);
  return !(f === undefined || f === null || String(f).trim() === "");
}
function optDate(input: Input, ...keys: string[]): string | null {
  for (const k of keys) {
    if (!has(input[k])) continue;
    const s = String(first(input[k])).trim();
    if (!validDate(s)) throw new InputError(`${k} must be a date YYYY-MM-DD`);
    return s;
  }
  return null;
}
function optNum(input: Input, key: string): number | null {
  return has(input[key]) ? num({ v: first(input[key]) }, "v") : null;
}
function optEnum<T extends string>(input: Input, key: string, allowed: readonly T[], aliases: Record<string, T> = {}): T | null {
  if (!has(input[key])) return null;
  const raw = String(first(input[key])).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[raw] ?? raw) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${key} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}
function yesNo(input: Input, key: string): YesNo {
  if (!has(input[key])) return "unknown";
  const v = String(first(input[key])).trim().toLowerCase();
  if (/^(1|true|yes|y|on|ok)$/.test(v)) return "yes";
  if (/^(0|false|no|n|off)$/.test(v)) return "no";
  return "unknown";
}

const ROUTE_ALIASES: Record<string, Route> = {
  ten_year: "general",
  "10y": "general",
  work: "general",
  spouse_of_japanese: "spouse",
  spouse_of_pr: "spouse",
  spouse_of_permanent_resident: "spouse",
  japanese_spouse: "spouse",
  child_of_japanese: "child",
  child_of_pr: "child",
  ltr: "long_term_resident",
  teijusha: "long_term_resident",
  hsp: "hsp70",
  hsp_70: "hsp70",
  hsp_80: "hsp80",
  j_skip: "special_hsp",
  jskip: "special_hsp",
};
const STATUS_ALIASES: Record<string, Status> = {
  gijinkoku: "engineer_humanities",
  engineer: "engineer_humanities",
  ict: "intra_company_transferee",
  hsp: "highly_skilled_professional",
  ssw1: "specified_skilled_worker_1",
  ssw2: "specified_skilled_worker_2",
  titp: "technical_intern_training",
  ikusei_shuro: "employment_for_skill_development",
  dependant: "dependent",
};
const PERIOD_ALIASES: Record<string, Period> = { "5": "5y", "3": "3y", "1": "1y", "5_years": "5y", "3_years": "3y", "1_year": "1y", "6_months": "6m", "3_months": "3m", none: "unlimited", indefinite: "unlimited" };

/** Trips: POST array [{depart, return}] or GET "2024-01-05_2024-03-01,2025-07-01_2026-02-01" (also "..", "/"). */
export function parseTrips(raw: unknown): Trip[] | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.map((t, i) => {
      const o = t as Record<string, unknown>;
      const depart = String(o.depart ?? o.from ?? o.out ?? "").trim();
      const ret = String(o.return ?? o.to ?? o.back ?? "").trim();
      if (!validDate(depart) || !validDate(ret)) throw new InputError(`trips[${i}] needs depart and return dates YYYY-MM-DD.`);
      return { depart, return: ret };
    });
  }
  const text = (Array.isArray(raw) ? raw.join(",") : String(raw)).trim();
  if (!text) return undefined;
  return text.split(/[,;\s]+/).filter(Boolean).map((seg) => {
    const m = seg.match(/^(\d{4}-\d{2}-\d{2})(?:_|\.\.|\/|~)(\d{4}-\d{2}-\d{2})$/);
    if (!m) throw new InputError(`Bad trip "${seg}". Use depart_return, e.g. 2024-01-05_2024-03-01.`);
    return { depart: m[1], return: m[2] };
  });
}

export function computeCheck(input: Input) {
  try {
    if (!has(input.route ?? input.category)) throw new InputError(`Missing route. Allowed: ${ROUTES.join(", ")}`);
    const route = optEnum({ route: input.route ?? input.category }, "route", ROUTES, ROUTE_ALIASES)!;
    const kids = has(input.schoolAgeChildren) ? String(first(input.schoolAgeChildren)).trim().toLowerCase() : "none";
    if (!["none", "all_in_school", "not_in_school"].includes(kids)) throw new InputError("schoolAgeChildren must be none, all_in_school or not_in_school");
    return checkPr({
      route,
      applicationDate: optDate(input, "applicationDate", "filingDate", "date") ?? todayJst(),
      residenceSince: optDate(input, "residenceSince", "arrivalDate"),
      yearsInJapan: optNum(input, "yearsInJapan"),
      workOrResidenceYears: optNum(input, "workOrResidenceYears") ?? optNum(input, "workYears"),
      currentStatus: optEnum(input, "currentStatus", STATUSES, STATUS_ALIASES),
      periodOfStay: optEnum(input, "periodOfStay", PERIODS, PERIOD_ALIASES),
      periodExpiry: optDate(input, "periodExpiry", "cardExpiry"),
      marriageDate: optDate(input, "marriageDate"),
      qualifyingSince: optDate(input, "qualifyingSince"),
      trips: parseTrips(input.trips),
      longestTripDays: optNum(input, "longestTripDays"),
      totalAbsenceDays: optNum(input, "totalAbsenceDays"),
      japaneseB1: yesNo(input, "japaneseB1"),
      b1Exemption: (optEnum(input, "b1Exemption", B1_EXEMPTIONS) ?? "none") as B1Exemption,
      schoolAgeChildren: kids as "none" | "all_in_school" | "not_in_school",
      taxesPaidOnTime: yesNo(input, "taxesPaidOnTime"),
      pensionInsurancePaidOnTime: yesNo(input, "pensionInsurancePaidOnTime"),
      firstPrApplication: bool(input, "firstPrApplication", true),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanPermanentResidencyCheck",
    summary: "Which Japan permanent residence (PR, 永住) guideline applies to my filing date, and do I meet its objective factors?",
    description:
      "Japan's Immigration Services Agency revised its permanent residence guideline on 2026-10-01. Filed up to 2026-03-31: 2026-02-24 guideline. Filed 2026-04-01 to 2027-03-31: 2026-02-24 guideline plus the revised income (household income above the Japanese average for the household size) and not-a-public-burden factors (also for cases pending on 2026-10-01). Filed from 2027-04-01: revised guideline in full — spouses of Japanese/PRs need 5 years of marriage + 3 years in Japan (was 3 + 1), children 3 years (was 1), Intra-company Transferee and Employment for Skill Development no longer count as work status, a 3-year period of stay counts as 'longest' only under a narrow transition, and new factors: no single trip abroad of 6+ months or 2.5+ years in total in the last 10 years, Japanese at CEFR B1, projected pension, rules understanding, school attendance. Returns summary (objective_issue / need_more_info / no_objective_blocker — never an approval prediction), the guideline band, checks[] with status (issue/review/unknown/meets/not_considered/info) and official sources, the time requirement with the earliest date you meet it, an old-vs-new filing window for spouse/child routes, absence analysis, key dates with day counts, the ¥200,000 PR fee, notes and a disclaimer.",
    params: [
      { name: "route", type: "string", required: true, enum: ROUTES, description: "PR route: general (10 years), spouse (of a Japanese national / PR / SPR), child, long_term_resident, refugee, hsp70, hsp80, special_hsp, contribution, special_zone_regional." },
      { name: "applicationDate", type: "string", description: "YYYY-MM-DD you filed or plan to file. Decides which guideline applies. Default: today in Japan." },
      { name: "residenceSince", type: "string", description: "YYYY-MM-DD your continuous residence in Japan began (alternative: yearsInJapan)." },
      { name: "yearsInJapan", type: "number", minimum: 0, maximum: 100, description: "Years of continuous residence in Japan at filing (used if residenceSince is not given)." },
      { name: "workOrResidenceYears", type: "number", minimum: 0, maximum: 100, description: "General route: continuous years on a qualifying work or residence status (excluding Technical Intern Training, Specified Skilled Worker (i), and from 2027-04-01 also Intra-company Transferee and Employment for Skill Development)." },
      { name: "currentStatus", type: "string", enum: STATUSES, description: "Current status of residence, to flag statuses that do not count as work status (aliases: gijinkoku, ict, ssw1, titp)." },
      { name: "periodOfStay", type: "string", enum: PERIODS, description: "Period of stay on your residence card: 5y, 3y, 1y, 6m, 3m, unlimited, other." },
      { name: "periodExpiry", type: "string", description: "YYYY-MM-DD your current period of stay expires (needed for the 3-year transition from 2027-04-01)." },
      { name: "marriageDate", type: "string", description: "Spouse route: YYYY-MM-DD the substantive marriage began." },
      { name: "qualifyingSince", type: "string", description: "Special routes: YYYY-MM-DD the qualifying period began (Long-Term Resident status, refugee recognition, HSP points, ...)." },
      { name: "trips", type: "string", description: "Trips abroad in the last 10 years. GET: comma-separated depart_return pairs, e.g. 2024-01-05_2024-03-01,2025-07-01_2026-02-01. POST: array of {depart, return}." },
      { name: "longestTripDays", type: "number", minimum: 0, description: "If you do not list trips: days of your longest single trip abroad in the last 10 years." },
      { name: "totalAbsenceDays", type: "number", minimum: 0, description: "If you do not list trips: total days abroad in the last 10 years." },
      { name: "japaneseB1", type: "boolean", description: "Japanese at CEFR B1 level or above (true/false; omit if unknown)." },
      { name: "b1Exemption", type: "string", enum: B1_EXEMPTIONS, default: "none", description: "B1 not considered for: hsp_or_family, schooling_6y (6+ years of elementary/secondary schooling in Japan), pr_child_born_in_japan." },
      { name: "schoolAgeChildren", type: "string", enum: ["none", "all_in_school", "not_in_school"], default: "none", description: "School-age children and whether they attend elementary / junior high school." },
      { name: "taxesPaidOnTime", type: "boolean", description: "All taxes paid by their original due dates." },
      { name: "pensionInsurancePaidOnTime", type: "boolean", description: "Pension and health insurance premiums paid on time." },
      { name: "firstPrApplication", type: "boolean", default: true, description: "This is your first PR application filed from 2027-04-01 (for the 3-year transition)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan PR Guideline Check",
  nameForModel: "japan_pr_check",
  descriptionForHuman: "Which Japan permanent residence guideline applies to your filing date, and what changed on 2026-10-01.",
  descriptionForModel:
    "Use when someone asks about applying for Japanese permanent residence (永住許可, eijuu, PR): how many years they need, the October 2026 guideline revision, whether to file before 2027-04-01, the spouse rule (5 years marriage + 3 years residence from 2027-04-01, was 3 + 1), whether a 3-year visa still counts, the 6-month / 2.5-year absence rule, Japanese B1, or the household income and pension factors. Your training data probably predates the 2026-10-01 revision; call this instead of guessing. Deterministic, dated rules with official ISA sources. Never present the result as an approval prediction; relay the disclaimer (not legal advice, permission is discretionary).",
  logo: "/icon.svg",
};
