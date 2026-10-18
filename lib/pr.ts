// Japan permanent residence (永住許可) guideline checker.
// Deterministic, dated rules from the Immigration Services Agency (ISA):
//  - 永住許可に関するガイドライン（令和8年10月1日改定）  https://www.moj.go.jp/isa/10_00279.html
//  - 永住許可に関するガイドライン（令和8年2月24日改訂）  https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html
//  - 【お知らせ】適用について（令和8年10月1日掲載）      https://www.moj.go.jp/isa/applications/procedures/eizyuu_00001.html
// Educational only. Permission is discretionary; this never says "you will be approved".

export const RULES_AS_OF = "2026-10-18";
export const REVISION_DATE = "2026-10-01";
export const INCOME_FROM = "2026-04-01"; // filings from this date get the new income + public-burden factors
export const FULL_FROM = "2027-04-01"; // filings from this date get the whole revised guideline
export const LAST_OLD_DAY = "2027-03-31";
export const PR_FEE_JPY = 200000;

export const DISCLAIMER =
  "Educational guide to the Immigration Services Agency's published permanent residence guidelines, not immigration or legal advice. Permission is at the Minister of Justice's broad discretion; meeting every factor here does not mean you will be approved. ISA does not publish its income, pension or asset thresholds. Check with ISA or a licensed immigration lawyer / gyoseishoshi before you file.";

export class RuleInputError extends Error {}

export type Band = "pre_2026_04" | "transition" | "revised";
export const BAND_LABEL: Record<Band, string> = {
  pre_2026_04: "2026-02-24 guideline (filed by 2026-03-31)",
  transition: "2026-02-24 guideline + the revised income and public-burden rules (filed 2026-04-01 to 2027-03-31)",
  revised: "2026-10-01 revised guideline in full (filed from 2027-04-01)",
};

export const ROUTES = [
  "general",
  "spouse",
  "child",
  "long_term_resident",
  "refugee",
  "hsp70",
  "hsp80",
  "special_hsp",
  "contribution",
  "special_zone_regional",
] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_LABEL: Record<Route, string> = {
  general: "General route: 10 years in Japan (5 on a work or residence status)",
  spouse: "Spouse of a Japanese national, permanent resident or special permanent resident",
  child: "Biological / specially adopted child of a Japanese national, PR or SPR",
  long_term_resident: "Long-Term Resident (定住者)",
  refugee: "Recognized refugee or complementary protection holder",
  hsp70: "Highly Skilled Professional points: 70+",
  hsp80: "Highly Skilled Professional points: 80+",
  special_hsp: "Special Highly Skilled Professional (J-Skip)",
  contribution: "Contribution to Japan (awards, public roles etc.)",
  special_zone_regional: "Special zone / regional revitalization plan activity",
};

export const STATUSES = [
  "engineer_humanities",
  "intra_company_transferee",
  "highly_skilled_professional",
  "business_manager",
  "skilled_labor",
  "specified_skilled_worker_2",
  "specified_skilled_worker_1",
  "technical_intern_training",
  "employment_for_skill_development",
  "spouse_of_japanese",
  "spouse_of_permanent_resident",
  "long_term_resident",
  "dependent",
  "student",
  "designated_activities",
  "other_work",
] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  engineer_humanities: "Engineer / Specialist in Humanities / International Services",
  intra_company_transferee: "Intra-company Transferee (企業内転勤)",
  highly_skilled_professional: "Highly Skilled Professional",
  business_manager: "Business Manager",
  skilled_labor: "Skilled Labor",
  specified_skilled_worker_2: "Specified Skilled Worker (ii)",
  specified_skilled_worker_1: "Specified Skilled Worker (i)",
  technical_intern_training: "Technical Intern Training (技能実習)",
  employment_for_skill_development: "Employment for Skill Development (育成就労)",
  spouse_of_japanese: "Spouse or Child of Japanese National",
  spouse_of_permanent_resident: "Spouse or Child of Permanent Resident",
  long_term_resident: "Long-Term Resident",
  dependent: "Dependent (家族滞在)",
  student: "Student",
  designated_activities: "Designated Activities (特定活動)",
  other_work: "Other work status",
};

/** Statuses that never count as a "work status" for the 5-year part of the 10-year rule. */
const NOT_WORK_OLD: Status[] = ["technical_intern_training", "specified_skilled_worker_1"];
const NOT_WORK_REVISED: Status[] = ["technical_intern_training", "employment_for_skill_development", "specified_skilled_worker_1", "intra_company_transferee"];
const NOT_WORK_OR_RESIDENCE: Status[] = ["dependent", "student"];

export const PERIODS = ["5y", "3y", "1y", "6m", "3m", "unlimited", "other"] as const;
export type Period = (typeof PERIODS)[number];
export const PERIOD_LABEL: Record<Period, string> = {
  "5y": "5 years",
  "3y": "3 years",
  "1y": "1 year",
  "6m": "6 months",
  "3m": "3 months",
  unlimited: "No limit (HSP (ii))",
  other: "Other / not sure",
};

export const B1_EXEMPTIONS = ["none", "hsp_or_family", "schooling_6y", "pr_child_born_in_japan"] as const;
export type B1Exemption = (typeof B1_EXEMPTIONS)[number];
export type YesNo = "yes" | "no" | "unknown";
export type Trip = { depart: string; return: string };

export type CheckInput = {
  route: Route;
  applicationDate: string;
  residenceSince?: string | null; // start of continuous residence in Japan
  yearsInJapan?: number | null; // alternative to residenceSince
  workOrResidenceYears?: number | null; // continuous years on a qualifying work/residence status
  currentStatus?: Status | null;
  periodOfStay?: Period | null;
  periodExpiry?: string | null;
  marriageDate?: string | null; // start of the substantive marriage (spouse route)
  qualifyingSince?: string | null; // start date for the special route (LTR, refugee recognition, HSP points, ...)
  trips?: Trip[];
  longestTripDays?: number | null;
  totalAbsenceDays?: number | null;
  japaneseB1?: YesNo;
  b1Exemption?: B1Exemption;
  schoolAgeChildren?: "none" | "all_in_school" | "not_in_school";
  taxesPaidOnTime?: YesNo;
  pensionInsurancePaidOnTime?: YesNo;
  firstPrApplication?: boolean;
};

export type CheckStatus = "meets" | "issue" | "review" | "not_considered" | "unknown" | "info";
export type Check = { id: string; label: string; status: CheckStatus; detail: string; source: string };

export const SOURCES = [
  "https://www.moj.go.jp/isa/10_00279.html",
  "https://www.moj.go.jp/isa/content/001471577.pdf",
  "https://www.moj.go.jp/isa/applications/procedures/eizyuu_00001.html",
  "https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html",
  "https://public-comment.e-gov.go.jp/pcm/1040?CLASSNAME=PCM1040&id=315000140&Mode=1",
  "https://www.moj.go.jp/isa/01_00644.html",
] as const;
const SRC_REVISED = "ISA guideline revised 2026-10-01 (https://www.moj.go.jp/isa/10_00279.html)";
const SRC_OLD = "ISA guideline revised 2026-02-24 (https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html)";
const SRC_NOTICE = "ISA notice on which guideline applies, 2026-10-01 (https://www.moj.go.jp/isa/applications/procedures/eizyuu_00001.html)";

/* ---------------- dates ---------------- */

export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function toMs(s: string): number {
  return Date.parse(`${s}T00:00:00Z`);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / 86_400_000);
}
/** Same calendar day N months later (clamped to month end). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ny, nm, Math.min(d, last))).toISOString().slice(0, 10);
}
export function addYears(iso: string, years: number): string {
  return addMonths(iso, Math.round(years * 12));
}
export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}
function yearsBetween(a: string, b: string): number {
  // whole + fractional years using months
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  let months = (by - ay) * 12 + (bm - am);
  if (bd < ad) months -= 1;
  return Math.max(0, months) / 12;
}

export function bandFor(applicationDate: string): Band {
  if (applicationDate < INCOME_FROM) return "pre_2026_04";
  if (applicationDate < FULL_FROM) return "transition";
  return "revised";
}

/* ---------------- residence-period requirement ---------------- */

type Req = { years: number; marriageYears?: number; workYears?: number; basis: string; changed?: string };

export function requirementFor(route: Route, band: Band): Req {
  const revised = band === "revised";
  switch (route) {
    case "general":
      return { years: 10, workYears: 5, basis: "10+ years continuous residence, including 5+ continuous years on a work or residence status" };
    case "spouse":
      return revised
        ? { years: 3, marriageYears: 5, basis: "substantive marriage 5+ years and 3+ years continuous residence", changed: "Was marriage 3+ years and residence 1+ year for filings up to 2027-03-31." }
        : { years: 1, marriageYears: 3, basis: "substantive marriage 3+ years and 1+ year continuous residence", changed: "Becomes marriage 5+ years and residence 3+ years for filings from 2027-04-01." };
    case "child":
      return revised
        ? { years: 3, basis: "3+ years continuous residence", changed: "Was 1+ year for filings up to 2027-03-31." }
        : { years: 1, basis: "1+ year continuous residence", changed: "Becomes 3+ years for filings from 2027-04-01." };
    case "long_term_resident":
      return { years: 5, basis: "5+ years continuous residence as a Long-Term Resident" };
    case "refugee":
      return { years: 5, basis: "5+ years continuous residence after recognition" };
    case "hsp70":
      return { years: 3, basis: "70+ HSP points kept for 3+ years of continuous residence" };
    case "hsp80":
      return { years: 1, basis: "80+ HSP points kept for 1+ year of continuous residence" };
    case "special_hsp":
      return { years: 1, basis: "1+ year as (or meeting the criteria of) a Special Highly Skilled Professional" };
    case "contribution":
      return { years: 5, basis: "recognized contribution to Japan and 5+ years in Japan" };
    case "special_zone_regional":
      return { years: 3, basis: "3+ years continuous residence in the special zone / regional revitalization activity" };
  }
}

/* ---------------- absences ---------------- */

export const SINGLE_TRIP_MONTHS = 6;
export const TOTAL_ABSENCE_DAYS = 913; // 2 years 6 months ≈ 2*365 + 183

export type AbsenceResult = {
  windowStart: string;
  windowEnd: string;
  method: "trips" | "summary" | "none";
  tripsCounted: number;
  longestTripDays: number | null;
  longestTrip: Trip | null;
  anyTripSixMonthsOrMore: boolean | null;
  totalAbsenceDays: number | null;
  totalLimitDays: number;
};

export function analyzeAbsences(applicationDate: string, trips: Trip[] | undefined, longest?: number | null, total?: number | null): AbsenceResult {
  const windowStart = addYears(applicationDate, -10);
  const base = { windowStart, windowEnd: applicationDate, totalLimitDays: TOTAL_ABSENCE_DAYS };
  if (trips && trips.length) {
    let sum = 0;
    let best: Trip | null = null;
    let bestDays = -1;
    let six = false;
    let counted = 0;
    for (const t of trips) {
      if (!validDate(t.depart) || !validDate(t.return)) throw new RuleInputError("Each trip needs depart and return dates YYYY-MM-DD.");
      if (t.return < t.depart) throw new RuleInputError(`Trip ${t.depart} → ${t.return}: return is before departure.`);
      if (t.return <= windowStart || t.depart >= applicationDate) continue;
      const from = t.depart < windowStart ? windowStart : t.depart;
      const to = t.return > applicationDate ? applicationDate : t.return;
      const days = daysBetween(from, to);
      counted += 1;
      sum += days;
      const full = daysBetween(t.depart, t.return);
      if (full > bestDays) {
        bestDays = full;
        best = t;
      }
      if (t.return >= addMonths(t.depart, SINGLE_TRIP_MONTHS)) six = true;
    }
    return { ...base, method: "trips", tripsCounted: counted, longestTripDays: counted ? bestDays : 0, longestTrip: best, anyTripSixMonthsOrMore: six, totalAbsenceDays: sum };
  }
  if ((longest !== null && longest !== undefined) || (total !== null && total !== undefined)) {
    return {
      ...base,
      method: "summary",
      tripsCounted: 0,
      longestTripDays: longest ?? null,
      longestTrip: null,
      anyTripSixMonthsOrMore: longest === null || longest === undefined ? null : longest >= 182,
      totalAbsenceDays: total ?? null,
    };
  }
  return { ...base, method: "none", tripsCounted: 0, longestTripDays: null, longestTrip: null, anyTripSixMonthsOrMore: null, totalAbsenceDays: null };
}

/* ---------------- main check ---------------- */

export type CheckResult = ReturnType<typeof checkPr>;

const STATUS_RANK: Record<CheckStatus, number> = { issue: 0, review: 1, unknown: 2, meets: 3, info: 4, not_considered: 5 };

export function checkPr(input: CheckInput) {
  const { route } = input;
  if (!(ROUTES as readonly string[]).includes(route)) throw new RuleInputError(`Unknown route "${route}". Allowed: ${ROUTES.join(", ")}`);
  const applicationDate = input.applicationDate;
  if (!validDate(applicationDate)) throw new RuleInputError("applicationDate must be YYYY-MM-DD.");
  if (applicationDate < "2020-01-01" || applicationDate > "2035-12-31") throw new RuleInputError("applicationDate must be between 2020-01-01 and 2035-12-31.");
  for (const k of ["residenceSince", "marriageDate", "qualifyingSince", "periodExpiry"] as const) {
    const v = input[k];
    if (v && !validDate(v)) throw new RuleInputError(`${k} must be YYYY-MM-DD.`);
  }
  const band = bandFor(applicationDate);
  const revised = band === "revised";
  const req = requirementFor(route, band);
  const checks: Check[] = [];
  const keyDates: { date: string; label: string; daysFromToday: number }[] = [];
  const today = todayJst();
  const notes: string[] = [];
  if (route === "contribution") notes.push("ISA abolishes the separate Guideline for PR for persons who contributed to Japan (我が国への貢献があると認められる者への永住許可のガイドライン) on 2027-03-31; check how contribution cases are handled after that.");

  // --- which guideline ---
  checks.push({
    id: "guideline",
    label: "Guideline that applies (by filing date)",
    status: "info",
    detail:
      band === "pre_2026_04"
        ? `Filed ${applicationDate}: the 2026-02-24 guideline applies.`
        : band === "transition"
          ? `Filed ${applicationDate}: the 2026-02-24 guideline applies, except the income rule (2(4)(2)) and "not a public burden" (2(5)(7)) of the 2026-10-01 revision. Pension, Japanese B1, rules-understanding, school-attendance and absence factors do not yet apply.`
          : `Filed ${applicationDate}: the 2026-10-01 revised guideline applies in full.`,
    source: SRC_NOTICE,
  });

  // --- time requirement ---
  let yearsIn: number | null = null;
  if (input.residenceSince) yearsIn = yearsBetween(input.residenceSince, applicationDate);
  else if (input.yearsInJapan !== null && input.yearsInJapan !== undefined) yearsIn = input.yearsInJapan;
  if (yearsIn !== null && (yearsIn < 0 || yearsIn > 100)) throw new RuleInputError("Years in Japan must be 0–100.");
  const special = route !== "general" && route !== "spouse" && route !== "child";
  let qualifyingYears: number | null = null;
  if (special) {
    if (input.qualifyingSince) qualifyingYears = yearsBetween(input.qualifyingSince, applicationDate);
    else qualifyingYears = yearsIn;
  }
  const marriageYears = input.marriageDate ? yearsBetween(input.marriageDate, applicationDate) : null;
  const timeYears = special ? qualifyingYears : yearsIn;
  const parts: string[] = [];
  let timeStatus: CheckStatus = "unknown";
  if (timeYears !== null) {
    const ok = timeYears + 1e-9 >= req.years;
    parts.push(`${special ? "Qualifying period" : "Continuous residence"} ${timeYears.toFixed(1)} of ${req.years} years`);
    timeStatus = ok ? "meets" : "issue";
  }
  if (req.marriageYears !== undefined) {
    if (marriageYears === null) {
      timeStatus = timeStatus === "issue" ? "issue" : "unknown";
      parts.push(`marriage length unknown (needs ${req.marriageYears}+ years)`);
    } else {
      const ok = marriageYears + 1e-9 >= req.marriageYears;
      parts.push(`marriage ${marriageYears.toFixed(1)} of ${req.marriageYears} years`);
      if (!ok) timeStatus = "issue";
      else if (timeStatus === "unknown" && timeYears === null) timeStatus = "unknown";
    }
  }
  if (req.workYears !== undefined) {
    const w = input.workOrResidenceYears;
    if (w === null || w === undefined) {
      if (timeStatus === "meets") timeStatus = "unknown";
      parts.push(`work/residence-status years unknown (needs ${req.workYears}+)`);
    } else {
      if (w < 0 || w > 100) throw new RuleInputError("workOrResidenceYears must be 0–100.");
      parts.push(`work or residence status ${w} of ${req.workYears} years`);
      if (w + 1e-9 < req.workYears) timeStatus = "issue";
    }
  }
  // earliest date the time requirement is met (when start dates are known)
  let earliest: string | null = null;
  const cands: string[] = [];
  if (!special && input.residenceSince) cands.push(addYears(input.residenceSince, req.years));
  if (special && input.qualifyingSince) cands.push(addYears(input.qualifyingSince, req.years));
  if (req.marriageYears !== undefined && input.marriageDate) cands.push(addYears(input.marriageDate, req.marriageYears));
  const needed = 1 + (req.marriageYears !== undefined ? 1 : 0);
  if (cands.length >= needed && cands.length) earliest = cands.sort().at(-1)!;
  checks.push({
    id: "time",
    label: `Time in Japan: ${ROUTE_LABEL[route]}`,
    status: timeStatus,
    detail: `Needs ${req.basis}. ${parts.length ? parts.join("; ") + "." : "Give residenceSince (or yearsInJapan)" + (req.marriageYears !== undefined ? " and marriageDate" : "") + " to check."}${earliest ? ` Met from ${earliest} under this filing date's rules.` : ""}${req.changed ? ` ${req.changed}` : ""}`,
    source: revised ? SRC_REVISED : SRC_OLD,
  });

  // old-vs-new comparison for spouse / child (the deadline question)
  let filingWindow: { oldRuleEarliest: string | null; newRuleEarliest: string | null; oldRuleDeadline: string; canUseOldRule: boolean | null } | null = null;
  if (route === "spouse" || route === "child") {
    const oldReq = requirementFor(route, "transition");
    const newReq = requirementFor(route, "revised");
    const e = (r: Req) => {
      if (!input.residenceSince) return null;
      const c = [addYears(input.residenceSince, r.years)];
      if (r.marriageYears !== undefined) {
        if (!input.marriageDate) return null;
        c.push(addYears(input.marriageDate, r.marriageYears));
      }
      return c.sort().at(-1)!;
    };
    const oldE = e(oldReq);
    const newE = e(newReq);
    const canOld = oldE === null ? null : oldE <= LAST_OLD_DAY;
    filingWindow = { oldRuleEarliest: oldE, newRuleEarliest: newE, oldRuleDeadline: LAST_OLD_DAY, canUseOldRule: canOld };
    if (canOld === true) notes.push(`Under the older ${route === "spouse" ? "3-year marriage / 1-year residence" : "1-year residence"} rule you meet the time requirement from ${oldE}; that rule covers filings up to ${LAST_OLD_DAY}. From ${FULL_FROM} the ${route === "spouse" ? "5-year marriage / 3-year residence" : "3-year residence"} rule applies${newE ? ` (met from ${newE})` : ""}.`);
    if (canOld === false) notes.push(`You would not reach the older time requirement before ${LAST_OLD_DAY} (met ${oldE}), so the revised rule applies${newE ? `: met from ${newE}` : ""}.`);
  }

  // --- work status counting (general route) ---
  if (route === "general" && input.currentStatus) {
    const s = input.currentStatus;
    const list = revised ? NOT_WORK_REVISED : NOT_WORK_OLD;
    if (list.includes(s)) {
      checks.push({
        id: "work_status",
        label: "Does your current status count as a work status?",
        status: "review",
        detail: `${STATUS_LABEL[s]} does not count toward the 5 years on a work or residence status under ${revised ? "the revised guideline (excludes Technical Intern Training, Employment for Skill Development, Specified Skilled Worker (i), Intra-company Transferee and some Designated Activities)" : "the 2026-02-24 guideline (excludes Technical Intern Training and Specified Skilled Worker (i))"}. It still counts toward the 10 years in Japan.`,
        source: revised ? SRC_REVISED : SRC_OLD,
      });
    } else if (NOT_WORK_OR_RESIDENCE.includes(s)) {
      checks.push({ id: "work_status", label: "Does your current status count as a work status?", status: "review", detail: `${STATUS_LABEL[s]} is neither a work nor a residence status, so years on it do not count toward the 5 years (they can count toward the 10 years).`, source: revised ? SRC_REVISED : SRC_OLD });
    } else if (s === "intra_company_transferee" && !revised) {
      checks.push({ id: "work_status", label: "Does your current status count as a work status?", status: "meets", detail: "Intra-company Transferee counts as a work status under the 2026-02-24 guideline, but NOT under the revised guideline (filings from 2027-04-01).", source: SRC_OLD });
    } else if (s === "designated_activities") {
      checks.push({ id: "work_status", label: "Does your current status count as a work status?", status: "review", detail: revised ? "Depends on the designated activity. Counts: No. 46 (Japanese university graduates), No. 36/37 (designated research / IT), EPA nurses and care workers. Does not count: working holiday, internship; job-hunting, job-offer waiting and similar temporary stays do not even count toward the 10 years." : "Depends on the designated activity; ask ISA.", source: revised ? SRC_REVISED : SRC_OLD });
    }
  }
  if (route === "general" && input.currentStatus === "intra_company_transferee" && !revised) {
    notes.push("Intra-company Transferee years stop counting as work-status years for filings from 2027-04-01.");
  }

  // --- longest period of stay ---
  const p = input.periodOfStay ?? null;
  let periodStatus: CheckStatus = "unknown";
  let periodDetail = "Give periodOfStay (the period printed on your residence card).";
  if (p) {
    if (p === "5y" || p === "unlimited") {
      periodStatus = "meets";
      periodDetail = `${PERIOD_LABEL[p]} is the longest period for most statuses.`;
    } else if (p === "3y") {
      if (!revised) {
        periodStatus = "meets";
        periodDetail = `A 3-year period counts as the longest period for filings up to ${LAST_OLD_DAY}.`;
      } else {
        const exp = input.periodExpiry;
        const first = input.firstPrApplication !== false;
        if (!exp) {
          periodStatus = "review";
          periodDetail = `From ${FULL_FROM} a 3-year period counts only if you held it on ${LAST_OLD_DAY}, this is your first PR application filed from ${FULL_FROM}, and ISA decides before that 3-year period expires. Give periodExpiry to check.`;
        } else if (exp < LAST_OLD_DAY || exp <= applicationDate) {
          periodStatus = "issue";
          periodDetail = `Your 3-year period ends ${exp}; it does not run past ${LAST_OLD_DAY} into a filing from ${FULL_FROM} (a new 3-year period granted after ${LAST_OLD_DAY} does not qualify).`;
        } else if (!first) {
          periodStatus = "issue";
          periodDetail = `The 3-year exception covers only the first PR application filed from ${FULL_FROM}.`;
        } else {
          periodStatus = "review";
          periodDetail = `Counts only if you held this 3-year period on ${LAST_OLD_DAY} and ISA decides by ${exp} (${daysBetween(applicationDate, exp)} days after filing). If the decision comes later, the exception is lost.`;
        }
      }
    } else if (p === "other") {
      periodStatus = "unknown";
      periodDetail = "Check the period on your residence card; it must be the longest period for your status (usually 5 years).";
    } else {
      periodStatus = "issue";
      periodDetail = `${PERIOD_LABEL[p]} is not the longest period of stay; holders are generally assessed negatively. Most applicants need 5 years (3 years until ${LAST_OLD_DAY}).`;
    }
  }
  checks.push({ id: "period_of_stay", label: "Holding the longest period of stay", status: periodStatus, detail: periodDetail, source: revised ? SRC_REVISED : SRC_OLD });

  // --- absences ---
  const abs = analyzeAbsences(applicationDate, input.trips, input.longestTripDays, input.totalAbsenceDays);
  {
    let st: CheckStatus = "unknown";
    let d = "";
    if (abs.method === "none") {
      if (revised) d = "Give your trips abroad (or longestTripDays / totalAbsenceDays) for the 10 years before filing.";
      else {
        st = "not_considered";
        d = `The explicit 6-month / 2.5-year absence rule applies to filings from ${FULL_FROM}. Before that, long or frequent trips can still break "continuous residence" (judged case by case).`;
      }
    }
    else {
      const longIssue = abs.anyTripSixMonthsOrMore === true;
      const totalIssue = abs.totalAbsenceDays !== null && abs.totalAbsenceDays >= TOTAL_ABSENCE_DAYS;
      const near = (abs.longestTripDays ?? 0) >= 150 || (abs.totalAbsenceDays ?? 0) >= 800;
      d = `Window ${abs.windowStart} → ${abs.windowEnd}: longest single trip ${abs.longestTripDays ?? "?"} days${abs.longestTrip ? ` (${abs.longestTrip.depart} → ${abs.longestTrip.return})` : ""}, total ${abs.totalAbsenceDays ?? "?"} days (limit 2 years 6 months ≈ ${TOTAL_ABSENCE_DAYS} days).`;
      if (revised) {
        st = longIssue || totalIssue ? "issue" : near ? "review" : abs.totalAbsenceDays === null || abs.anyTripSixMonthsOrMore === null ? "unknown" : "meets";
        d += longIssue || totalIssue ? " Without a reasonable reason this is generally assessed negatively." : near ? " Close to a limit; keep evidence of the reasons for long trips." : "";
      } else {
        st = "not_considered";
        d += ` The explicit 6-month / 2.5-year absence rule is in the revised guideline for filings from ${FULL_FROM}; ${longIssue || totalIssue ? "your trips would exceed it then, and long absences can still affect \"continuous residence\"." : "you would be within it."}`;
      }
    }
    checks.push({ id: "absences", label: "Time abroad in the last 10 years (one trip under 6 months, total under 2.5 years)", status: st, detail: d, source: SRC_REVISED });
  }

  // --- income ---
  const incomeApplies = band !== "pre_2026_04";
  const incomeExempt = route === "spouse" || route === "child" || route === "refugee";
  checks.push({
    id: "income",
    label: "Household income above the Japanese average for your household size",
    status: incomeApplies ? (incomeExempt ? "not_considered" : "review") : "info",
    detail: incomeApplies
      ? incomeExempt
        ? "Spouses and children of Japanese nationals / PRs (and recognized refugees) do not need the independent-livelihood requirement, but a household that is (or is realistically about to be) a public burden without special circumstances can be assessed negatively."
        : "Household income must stay above the average income of Japanese households of the same size. ISA does not publish the figure. Count the household's combined income, but not income a Dependent (家族滞在) or other non-work-status family member earns on a side-work permit; dependents abroad you support add to the household size; 5+ people adds a living-cost uplift."
      : "Filed before 2026-04-01: the older 'stable livelihood' wording applies (no published amount).",
    source: incomeApplies ? SRC_REVISED : SRC_OLD,
  });

  // --- pension ---
  checks.push({
    id: "pension",
    label: "Expected future pension (or financial assets to make up the gap)",
    status: revised ? (incomeExempt ? "not_considered" : "review") : "not_considered",
    detail: revised
      ? incomeExempt
        ? "Part of the independent-livelihood requirement, which spouses / children of Japanese nationals or PRs and recognized refugees do not need."
        : "Your projected pension must reach what a household at the income level would get after 30 years in the Employees' Pension, or you need financial assets (age-based, lower for younger applicants) to cover the gap. Amounts are not published. Check your record on Nenkin Net."
      : `Not a factor for filings before ${FULL_FROM}.`,
    source: SRC_REVISED,
  });

  // --- taxes & insurance ---
  const paid = (v?: YesNo) => v ?? "unknown";
  const tax = paid(input.taxesPaidOnTime);
  const pen = paid(input.pensionInsurancePaidOnTime);
  checks.push({
    id: "public_dues",
    label: "Taxes, pension and health insurance paid on time",
    status: tax === "no" || pen === "no" ? "issue" : tax === "yes" && pen === "yes" ? "meets" : "unknown",
    detail: `Paying late is assessed negatively even if it is settled by the time you apply${revised ? "; past delinquency procedures (滞納処分) also count" : ""}. ISA checks resident tax certificates (usually 5 years) and pension / health insurance records (usually 2 years).`,
    source: revised ? SRC_REVISED : SRC_OLD,
  });

  // --- Japanese B1 ---
  const ex = input.b1Exemption ?? "none";
  const b1 = input.japaneseB1 ?? "unknown";
  checks.push({
    id: "japanese_b1",
    label: "Japanese at CEFR B1 level or above",
    status: !revised ? "not_considered" : ex !== "none" ? "not_considered" : b1 === "yes" ? "meets" : b1 === "no" ? "issue" : "unknown",
    detail: !revised
      ? `Not a factor for filings before ${FULL_FROM}.`
      : ex !== "none"
        ? "Not considered for you (HSP or HSP family, 6+ years of elementary/secondary schooling under Japan's School Education Act, or a PR's child born in Japan whose parent has B1)."
        : "B1 on the 'Reference Framework for Japanese Language Education' (2021). ISA will announce how B1 is assessed (which tests) before April 2027.",
    source: SRC_REVISED,
  });

  // --- rules understanding ---
  checks.push({
    id: "rules_understanding",
    label: "Understanding of Japan's rules (Living and Working Guidebook)",
    status: revised ? "unknown" : "not_considered",
    detail: revised ? "Checked by a method ISA will designate, based mainly on the Guidebook on Living and Working (生活・就労ガイドブック). Method to be announced before April 2027." : `Not a factor for filings before ${FULL_FROM}.`,
    source: SRC_REVISED,
  });

  // --- school-age children ---
  const kids = input.schoolAgeChildren ?? "none";
  checks.push({
    id: "school_attendance",
    label: "School-age children attend elementary / junior high school",
    status: !revised || kids === "none" ? "not_considered" : kids === "all_in_school" ? "meets" : "issue",
    detail: !revised ? `Not a factor for filings before ${FULL_FROM}.` : kids === "none" ? "No school-age children (or not given)." : kids === "all_in_school" ? "Children of compulsory-school age attend an elementary or junior high school." : "A school-age child not attending elementary or junior high school is a negative factor.",
    source: SRC_REVISED,
  });

  // --- key dates ---
  const kd = (date: string, label: string) => keyDates.push({ date, label, daysFromToday: daysBetween(today, date) });
  kd(INCOME_FROM, "Filings from here: revised income and public-burden factors apply");
  kd(REVISION_DATE, "Revised guideline published");
  kd(LAST_OLD_DAY, "Last filing day under the 2026-02-24 guideline (3-year period counts as longest; spouse 3y/1y; child 1y; no B1 / pension / absence factors)");
  kd(FULL_FROM, "Revised guideline applies in full; PR revocation rules of the 2024 Immigration Act amendment take effect");
  if (earliest) kd(earliest, "You meet the time-in-Japan requirement (for this filing date's rules)");

  const sorted = [...checks].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  const issues = checks.filter((c) => c.status === "issue").length;
  const unknowns = checks.filter((c) => c.status === "unknown").length;
  const reviews = checks.filter((c) => c.status === "review").length;
  const summary = issues ? "objective_issue" : unknowns ? "need_more_info" : "no_objective_blocker";

  return {
    summary,
    summaryLabel: SUMMARY_LABEL[summary],
    band,
    guidelineApplied: BAND_LABEL[band],
    route,
    routeLabel: ROUTE_LABEL[route],
    applicationDate,
    counts: { issue: issues, review: reviews, unknown: unknowns },
    checks: sorted,
    timeRequirement: { ...req, earliestDate: earliest, yearsInJapan: yearsIn, marriageYears, qualifyingYears },
    filingWindow,
    absences: abs,
    keyDates: keyDates.sort((a, b) => a.date.localeCompare(b.date)),
    fee: { permanentResidencePermissionJPY: PR_FEE_JPY, note: "For applications received from 2026-10-01 (was ¥10,000); paid by revenue stamps only when permission is granted. Details: https://japan-visa-fee.vercel.app", source: "https://www.moj.go.jp/isa/01_00644.html" },
    notes: [
      ...notes,
      "Permission is discretionary: ISA weighs everything together, and meeting each factor does not guarantee approval.",
      "Income, pension and asset thresholds are not published (ISA public-comment answers No. 17 and 34).",
    ],
    rulesAsOf: RULES_AS_OF,
    sources: [...SOURCES],
  };
}

export const SUMMARY_LABEL: Record<string, string> = {
  objective_issue: "Objective issue found",
  need_more_info: "Need more info",
  no_objective_blocker: "No objective blocker found",
};

export const RULES = {
  name: "Japan permanent residence (永住許可) guideline rules",
  rulesAsOf: RULES_AS_OF,
  revisionPublished: REVISION_DATE,
  applicationBands: [
    { filed: "up to 2026-03-31", applies: "2026-02-24 guideline" },
    { filed: "2026-04-01 to 2027-03-31", applies: "2026-02-24 guideline, but income (2(4)(2)) and not-a-public-burden (2(5)(7)) of the 2026-10-01 revision (ISA: 'only the income-related parts'); covers applications already filed in this window too" },
    { filed: "from 2027-04-01", applies: "2026-10-01 revised guideline in full" },
  ],
  timeRequirements: ROUTES.map((r) => ({ route: r, label: ROUTE_LABEL[r], upTo20270331: requirementFor(r, "transition").basis, from20270401: requirementFor(r, "revised").basis })),
  workStatusExclusions: {
    upTo20270331: ["Technical Intern Training", "Specified Skilled Worker (i)"],
    from20270401: ["Technical Intern Training", "Employment for Skill Development", "Specified Skilled Worker (i)", "Intra-company Transferee", "some Designated Activities (working holiday, internship, high-school graduates' employment)"],
    notCountedTowardTenYears: ["Designated Activities for job hunting, job-offer waiting, start-up after graduation, pending refugee applications, stays due to unrest at home"],
  },
  longestPeriodOfStay: "Must hold the longest period of stay for your status (usually 5 years). A 3-year period counts for filings up to 2027-03-31; from 2027-04-01 only if held on 2027-03-31, the PR application is the first filed from 2027-04-01, and the decision comes before that 3-year period expires.",
  absences: "From 2027-04-01 filings: in the 10 years before filing, one trip of 6 months or more, or 2 years 6 months or more abroad in total, without a reasonable reason, is generally assessed negatively. This tool treats a trip as 6 months or more if the return date is on or after the same day 6 months later, and 2 years 6 months as 913 days (ISA publishes no day-count method).",
  revisedFactors: [
    "Household income above the Japanese average for the household size (amount not published)",
    "Projected pension vs. 30 years of Employees' Pension at that income level, or financial assets to cover the gap (amounts not published)",
    "Japanese at CEFR B1 or above (exempt: HSP and family, 6+ years schooling in Japan, PR's child born in Japan with a B1 parent); assessment method to be announced",
    "Understanding of Japan's rules (Living and Working Guidebook); method to be announced",
    "School-age children attending elementary / junior high school",
    "Not a public burden (also for spouses / children)",
  ],
  fees: { permanentResidencePermissionJPY: PR_FEE_JPY },
  sources: [...SOURCES],
  disclaimer: DISCLAIMER,
};
