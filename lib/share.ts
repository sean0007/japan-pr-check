import { PERIODS, ROUTES, STATUSES, validDate, type CheckInput, type Period, type Route, type Status, type YesNo } from "./pr";

export const PUBLIC_URL = "https://japan-pr-check.vercel.app";

/** Share links: /r?c=spouse&d=2027-02-15&s=2025-09-01&m=2023-06-10&p=3y[&e=][&y=][&w=][&q=][&lt=][&ta=][&b1=y|n] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}

export type Shared = {
  route: Route;
  applicationDate: string;
  residenceSince: string | null;
  yearsInJapan: number | null;
  workYears: number | null;
  marriageDate: string | null;
  qualifyingSince: string | null;
  periodOfStay: Period | null;
  periodExpiry: string | null;
  longestTripDays: number | null;
  totalAbsenceDays: number | null;
  japaneseB1: YesNo;
  currentStatus: Status | null;
  taxes: YesNo;
  pension: YesNo;
  kids: "none" | "all_in_school" | "not_in_school";
};

const BLANK: Omit<Shared, "route" | "applicationDate"> = {
  residenceSince: null,
  yearsInJapan: null,
  workYears: null,
  marriageDate: null,
  qualifyingSince: null,
  periodOfStay: null,
  periodExpiry: null,
  longestTripDays: null,
  totalAbsenceDays: null,
  japaneseB1: "unknown",
  currentStatus: null,
  taxes: "unknown",
  pension: "unknown",
  kids: "none",
};

export const EXAMPLE_SHARED: Shared = { ...BLANK, route: "spouse", applicationDate: "2027-02-15", residenceSince: "2025-09-01", marriageDate: "2023-06-10", periodOfStay: "3y" };
export const EXAMPLE_GENERAL: Shared = { ...BLANK, route: "general", applicationDate: "2027-06-01", residenceSince: "2016-04-01", workYears: 7, periodOfStay: "5y", longestTripDays: 210, totalAbsenceDays: 400 };

function okDate(v: string | undefined, min = "1950-01-01", max = "2035-12-31"): string | null {
  return v && validDate(v) && v >= min && v <= max ? v : null;
}
function okNum(v: string | undefined, max: number): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

export function parseShared(p: Params): Shared | null {
  const c = one(p, "c") ?? one(p, "route");
  if (!c || !(ROUTES as readonly string[]).includes(c)) return null;
  const d = okDate(one(p, "d") ?? one(p, "applicationDate"), "2020-01-01", "2035-12-31");
  if (!d) return null;
  const per = one(p, "p");
  const b1 = one(p, "b1");
  const yn = (v: string | undefined): YesNo => (v === "y" ? "yes" : v === "n" ? "no" : "unknown");
  const st = one(p, "st");
  const k = one(p, "k");
  return {
    route: c as Route,
    applicationDate: d,
    residenceSince: okDate(one(p, "s")),
    yearsInJapan: okNum(one(p, "y"), 100),
    workYears: okNum(one(p, "w"), 100),
    marriageDate: okDate(one(p, "m")),
    qualifyingSince: okDate(one(p, "q")),
    periodOfStay: per && (PERIODS as readonly string[]).includes(per) ? (per as Period) : null,
    periodExpiry: okDate(one(p, "e")),
    longestTripDays: okNum(one(p, "lt"), 4000),
    totalAbsenceDays: okNum(one(p, "ta"), 4000),
    japaneseB1: yn(b1),
    currentStatus: st && (STATUSES as readonly string[]).includes(st) ? (st as Status) : null,
    taxes: yn(one(p, "tx")),
    pension: yn(one(p, "pn")),
    kids: k === "in" ? "all_in_school" : k === "out" ? "not_in_school" : "none",
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("c", s.route);
  q.set("d", s.applicationDate);
  if (s.residenceSince) q.set("s", s.residenceSince);
  if (s.yearsInJapan !== null) q.set("y", String(s.yearsInJapan));
  if (s.workYears !== null) q.set("w", String(s.workYears));
  if (s.marriageDate) q.set("m", s.marriageDate);
  if (s.qualifyingSince) q.set("q", s.qualifyingSince);
  if (s.periodOfStay) q.set("p", s.periodOfStay);
  if (s.periodExpiry) q.set("e", s.periodExpiry);
  if (s.longestTripDays !== null) q.set("lt", String(s.longestTripDays));
  if (s.totalAbsenceDays !== null) q.set("ta", String(s.totalAbsenceDays));
  if (s.japaneseB1 !== "unknown") q.set("b1", s.japaneseB1 === "yes" ? "y" : "n");
  if (s.currentStatus) q.set("st", s.currentStatus);
  if (s.taxes !== "unknown") q.set("tx", s.taxes === "yes" ? "y" : "n");
  if (s.pension !== "unknown") q.set("pn", s.pension === "yes" ? "y" : "n");
  if (s.kids !== "none") q.set("k", s.kids === "all_in_school" ? "in" : "out");
  return q.toString();
}

export function toCheckInput(s: Shared): CheckInput {
  return {
    route: s.route,
    applicationDate: s.applicationDate,
    residenceSince: s.residenceSince,
    yearsInJapan: s.yearsInJapan,
    workOrResidenceYears: s.workYears,
    marriageDate: s.marriageDate,
    qualifyingSince: s.qualifyingSince,
    periodOfStay: s.periodOfStay,
    periodExpiry: s.periodExpiry,
    longestTripDays: s.longestTripDays,
    totalAbsenceDays: s.totalAbsenceDays,
    japaneseB1: s.japaneseB1,
    currentStatus: s.currentStatus,
    taxesPaidOnTime: s.taxes,
    pensionInsurancePaidOnTime: s.pension,
    schoolAgeChildren: s.kids,
  };
}

export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return resultPath(s) === resultPath(EXAMPLE_SHARED) || resultPath(s) === resultPath(EXAMPLE_GENERAL);
}

export const SUMMARY_COLOR: Record<string, string> = {
  objective_issue: "#fca5a5",
  need_more_info: "#f0b429",
  no_objective_blocker: "#99f6e4",
};
export const ROUTE_SHORT: Record<Route, string> = {
  general: "General (10 years)",
  spouse: "Spouse of Japanese / PR",
  child: "Child of Japanese / PR",
  long_term_resident: "Long-Term Resident",
  refugee: "Refugee",
  hsp70: "HSP 70 points",
  hsp80: "HSP 80 points",
  special_hsp: "J-Skip",
  contribution: "Contribution",
  special_zone_regional: "Special zone",
};
export const BAND_SHORT: Record<string, string> = {
  pre_2026_04: "2026-02 guideline",
  transition: "2026-02 guideline + new income rule",
  revised: "2026-10 revised guideline",
};

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
