"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { PERIODS, PERIOD_LABEL, ROUTES, ROUTE_LABEL, STATUSES, STATUS_LABEL, checkPr, type Period, type Route, type Status, type YesNo } from "@/lib/pr";
import { BAND_SHORT, EXAMPLE_SHARED, PUBLIC_URL, ROUTE_SHORT, fmtDate, resultPath, toCheckInput, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const STATUS_TONE: Record<string, string> = {
  issue: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  unknown: "border-amber/40 bg-amber/10 text-amber-100",
  review: "border-amber/30 bg-amber/5 text-amber-100",
  meets: "border-teal-300/30 bg-teal-400/5 text-teal-100",
  info: "border-line bg-white/5 text-muted",
  not_considered: "border-line bg-white/[0.02] text-muted",
};
const STATUS_WORD: Record<string, string> = {
  issue: "Issue",
  unknown: "Unknown",
  review: "Review",
  meets: "Meets",
  info: "Info",
  not_considered: "Not a factor",
};
const SUMMARY_TONE: Record<string, string> = {
  objective_issue: "text-rose-300",
  need_more_info: "text-amber",
  no_objective_blocker: "text-teal-200",
};

const SPECIAL: Route[] = ["long_term_resident", "refugee", "hsp70", "hsp80", "special_hsp", "contribution", "special_zone_regional"];

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function YesNoSelect({ value, onChange, label }: { value: YesNo; onChange: (v: YesNo) => void; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as YesNo)} className={field}>
        <option value="unknown">Not sure / skip</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [route, setRoute] = useState<Route>(start.route);
  const [applicationDate, setApplicationDate] = useState(start.applicationDate);
  const [residenceSince, setResidenceSince] = useState(start.residenceSince ?? "");
  const [workYears, setWorkYears] = useState(start.workYears === null ? "" : String(start.workYears));
  const [marriageDate, setMarriageDate] = useState(start.marriageDate ?? "");
  const [qualifyingSince, setQualifyingSince] = useState(start.qualifyingSince ?? "");
  const [currentStatus, setCurrentStatus] = useState<Status | "">(start.currentStatus ?? "");
  const [periodOfStay, setPeriodOfStay] = useState<Period | "">(start.periodOfStay ?? "");
  const [periodExpiry, setPeriodExpiry] = useState(start.periodExpiry ?? "");
  const [longest, setLongest] = useState(start.longestTripDays === null ? "" : String(start.longestTripDays));
  const [total, setTotal] = useState(start.totalAbsenceDays === null ? "" : String(start.totalAbsenceDays));
  const [b1, setB1] = useState<YesNo>(start.japaneseB1);
  const [taxes, setTaxes] = useState<YesNo>(start.taxes);
  const [pension, setPension] = useState<YesNo>(start.pension);
  const [kids, setKids] = useState<Shared["kids"]>(start.kids);

  const shared: Shared = {
    route,
    applicationDate,
    residenceSince: residenceSince || null,
    yearsInJapan: null,
    workYears: route === "general" ? num(workYears) : null,
    marriageDate: route === "spouse" ? marriageDate || null : null,
    qualifyingSince: SPECIAL.includes(route) ? qualifyingSince || null : null,
    periodOfStay: periodOfStay || null,
    periodExpiry: periodOfStay === "3y" ? periodExpiry || null : null,
    longestTripDays: num(longest),
    totalAbsenceDays: num(total),
    japaneseB1: b1,
    currentStatus: currentStatus || null,
    taxes,
    pension,
    kids,
  };
  const result = (() => {
    try {
      return checkPr(toCheckInput(shared));
    } catch {
      return null;
    }
  })();
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your case</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Route to permanent residence</span>
          <select value={route} onChange={(e) => setRoute(e.target.value as Route)} className={field} data-testid="route">
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {ROUTE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">Planned filing date (the date ISA receives it)</span>
          <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} className={field} data-testid="application-date" />
          <span className="mt-1 block text-xs text-muted">Old rules: filed by Mar 31, 2027. Full revised rules: filed from Apr 1, 2027.</span>
        </label>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">Living in Japan continuously since</span>
          <input type="date" value={residenceSince} onChange={(e) => setResidenceSince(e.target.value)} className={field} />
        </label>
        {route === "general" ? (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-foreground">Years on a work or residence status (not student / dependent)</span>
            <input inputMode="decimal" value={workYears} onChange={(e) => setWorkYears(e.target.value)} placeholder="e.g. 6" className={field} />
          </label>
        ) : null}
        {route === "spouse" ? (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-foreground">Marriage started (substantive marital life)</span>
            <input type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} className={field} />
          </label>
        ) : null}
        {SPECIAL.includes(route) ? (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-foreground">Qualifying since (status granted / points reached / recognition)</span>
            <input type="date" value={qualifyingSince} onChange={(e) => setQualifyingSince(e.target.value)} className={field} />
          </label>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Current status</span>
            <select value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value as Status | "")} className={field}>
              <option value="">Not given</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Current period of stay</span>
            <select value={periodOfStay} onChange={(e) => setPeriodOfStay(e.target.value as Period | "")} className={field}>
              <option value="">Not given</option>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {periodOfStay === "3y" ? (
          <label className="mt-5 block">
            <span className="text-sm font-medium text-foreground">That 3-year period expires on</span>
            <input type="date" value={periodExpiry} onChange={(e) => setPeriodExpiry(e.target.value)} className={field} />
          </label>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Longest trip abroad, last 10 years (days)</span>
            <input inputMode="numeric" value={longest} onChange={(e) => setLongest(e.target.value)} placeholder="e.g. 45" className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Total days abroad, last 10 years</span>
            <input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 300" className={field} />
          </label>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <YesNoSelect label="Taxes paid on time" value={taxes} onChange={setTaxes} />
          <YesNoSelect label="Pension + health insurance on time" value={pension} onChange={setPension} />
          <YesNoSelect label="Japanese at CEFR B1 or above" value={b1} onChange={setB1} />
          <label className="block">
            <span className="text-sm font-medium text-foreground">School-age children (6–15)</span>
            <select value={kids} onChange={(e) => setKids(e.target.value as Shared["kids"])} className={field}>
              <option value="none">None</option>
              <option value="all_in_school">All attend school</option>
              <option value="not_in_school">One or more not in school</option>
            </select>
          </label>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted">Nothing is sent anywhere. Trip-by-trip counting is available in the API (trips=depart_return,…).</p>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-panel/60" data-testid="result">
        <div className="flex-1 p-5 sm:p-7">
          {result ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
                {ROUTE_SHORT[result.route]} · filed {fmtDate(result.applicationDate)}
              </p>
              <h2 className={`mt-2 font-display text-3xl tracking-tight sm:text-4xl ${SUMMARY_TONE[result.summary]}`} data-testid="summary">
                {result.summaryLabel}
              </h2>
              <p className="mt-2 text-sm text-foreground">
                Rules for this date: <span className="text-amber">{BAND_SHORT[result.band]}</span>
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-black/30 p-4">
                  <p className="text-xs text-muted">Time requirement</p>
                  <p className="mt-1 text-sm text-foreground">{result.timeRequirement.basis}</p>
                  {result.timeRequirement.earliestDate ? <p className="mt-2 text-sm text-teal-200">Met from {fmtDate(result.timeRequirement.earliestDate)}</p> : null}
                </div>
                {result.filingWindow ? (
                  <div className="rounded-2xl border border-amber/40 bg-amber/5 p-4" data-testid="filing-window">
                    <p className="text-xs text-muted">Old vs new rule</p>
                    <p className="mt-1 text-sm text-foreground">
                      Old rule: {result.filingWindow.oldRuleEarliest ? fmtDate(result.filingWindow.oldRuleEarliest) : "—"}
                      {result.filingWindow.canUseOldRule ? " · file by Mar 31, 2027" : ""}
                    </p>
                    <p className="mt-1 text-sm text-foreground">New rule: {result.filingWindow.newRuleEarliest ? fmtDate(result.filingWindow.newRuleEarliest) : "—"}</p>
                  </div>
                ) : null}
              </div>
              <ul className="mt-5 space-y-2">
                {result.checks.map((c) => (
                  <li key={c.id} className={`rounded-2xl border px-4 py-3 ${STATUS_TONE[c.status]}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold">{c.label}</span>
                      <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase">{STATUS_WORD[c.status]}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed opacity-90">{c.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-muted">
                Fee if granted: ¥{result.fee.permanentResidencePermissionJPY.toLocaleString("en-US")} (from Oct 1, 2026). {result.notes[result.notes.length - 2]}
              </p>
              <div className="mt-5">
                <ShareBar url={shareUrl} text={`Japan PR guideline check: ${result.summaryLabel} (${ROUTE_SHORT[result.route]}, filed ${result.applicationDate}) – free tool`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-rose-200">Enter a valid filing date to see the check.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
