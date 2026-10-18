import assert from "node:assert/strict";
import test from "node:test";
import { addMonths, analyzeAbsences, bandFor, checkPr, requirementFor, RULES, type CheckInput } from "./pr";

const get = (r: ReturnType<typeof checkPr>, id: string) => r.checks.find((c) => c.id === id)!;

test("filing-date bands follow ISA's 2026-10-01 notice", () => {
  assert.equal(bandFor("2026-03-31"), "pre_2026_04");
  assert.equal(bandFor("2026-04-01"), "transition");
  assert.equal(bandFor("2027-03-31"), "transition");
  assert.equal(bandFor("2027-04-01"), "revised");
});

test("spouse route: 3y marriage + 1y residence until 2027-03-31, 5y + 3y from 2027-04-01", () => {
  assert.deepEqual([requirementFor("spouse", "transition").marriageYears, requirementFor("spouse", "transition").years], [3, 1]);
  assert.deepEqual([requirementFor("spouse", "revised").marriageYears, requirementFor("spouse", "revised").years], [5, 3]);
  const base: CheckInput = { route: "spouse", applicationDate: "2027-02-15", residenceSince: "2025-09-01", marriageDate: "2023-06-10", periodOfStay: "3y" };
  const before = checkPr(base);
  assert.equal(get(before, "time").status, "meets");
  assert.equal(before.timeRequirement.earliestDate, "2026-09-01");
  assert.equal(before.filingWindow?.canUseOldRule, true);
  assert.equal(before.filingWindow?.newRuleEarliest, "2028-09-01");
  assert.equal(get(before, "period_of_stay").status, "meets");
  const after = checkPr({ ...base, applicationDate: "2027-04-01" });
  assert.equal(after.band, "revised");
  assert.equal(get(after, "time").status, "issue");
  assert.equal(after.summary, "objective_issue");
});

test("child route 1y → 3y", () => {
  assert.equal(requirementFor("child", "transition").years, 1);
  assert.equal(requirementFor("child", "revised").years, 3);
});

test("general route: 10y + 5y work; ICT stops counting from 2027-04-01", () => {
  const r = checkPr({ route: "general", applicationDate: "2027-06-01", residenceSince: "2016-04-01", workOrResidenceYears: 7, currentStatus: "intra_company_transferee", periodOfStay: "5y" });
  assert.equal(get(r, "time").status, "meets");
  assert.equal(get(r, "work_status").status, "review");
  assert.match(get(r, "work_status").detail, /Intra-company Transferee/);
  const old = checkPr({ route: "general", applicationDate: "2026-12-01", residenceSince: "2016-04-01", workOrResidenceYears: 7, currentStatus: "intra_company_transferee", periodOfStay: "5y" });
  assert.equal(get(old, "work_status").status, "meets");
  const short = checkPr({ route: "general", applicationDate: "2026-12-01", yearsInJapan: 9, workOrResidenceYears: 6 });
  assert.equal(get(short, "time").status, "issue");
  const lowWork = checkPr({ route: "general", applicationDate: "2026-12-01", yearsInJapan: 12, workOrResidenceYears: 4 });
  assert.equal(get(lowWork, "time").status, "issue");
  const ssw1 = checkPr({ route: "general", applicationDate: "2026-12-01", yearsInJapan: 12, workOrResidenceYears: 6, currentStatus: "specified_skilled_worker_1" });
  assert.equal(get(ssw1, "work_status").status, "review");
});

test("3-year period of stay: counts until 2027-03-31; narrow transition after", () => {
  const before = checkPr({ route: "general", applicationDate: "2027-03-31", yearsInJapan: 11, workOrResidenceYears: 6, periodOfStay: "3y" });
  assert.equal(get(before, "period_of_stay").status, "meets");
  const noExp = checkPr({ route: "general", applicationDate: "2027-05-01", yearsInJapan: 11, workOrResidenceYears: 6, periodOfStay: "3y" });
  assert.equal(get(noExp, "period_of_stay").status, "review");
  const expired = checkPr({ route: "general", applicationDate: "2027-05-01", yearsInJapan: 11, workOrResidenceYears: 6, periodOfStay: "3y", periodExpiry: "2027-02-01" });
  assert.equal(get(expired, "period_of_stay").status, "issue");
  const ok = checkPr({ route: "general", applicationDate: "2027-05-01", yearsInJapan: 11, workOrResidenceYears: 6, periodOfStay: "3y", periodExpiry: "2028-06-30" });
  assert.equal(get(ok, "period_of_stay").status, "review");
  assert.match(get(ok, "period_of_stay").detail, /2028-06-30/);
  const second = checkPr({ route: "general", applicationDate: "2027-05-01", yearsInJapan: 11, workOrResidenceYears: 6, periodOfStay: "3y", periodExpiry: "2028-06-30", firstPrApplication: false });
  assert.equal(get(second, "period_of_stay").status, "issue");
  assert.equal(get(checkPr({ route: "general", applicationDate: "2026-12-01", periodOfStay: "1y" }), "period_of_stay").status, "issue");
  assert.equal(get(checkPr({ route: "hsp80", applicationDate: "2027-12-01", periodOfStay: "unlimited" }), "period_of_stay").status, "meets");
});

test("absences: 6-month single trip and 913-day total, only a factor from 2027-04-01", () => {
  assert.equal(addMonths("2025-08-31", 6), "2026-02-28");
  const a = analyzeAbsences("2027-06-01", [
    { depart: "2020-01-10", return: "2020-07-10" },
    { depart: "2024-05-01", return: "2024-06-01" },
  ]);
  assert.equal(a.anyTripSixMonthsOrMore, true);
  assert.equal(a.totalAbsenceDays, 182 + 31);
  const b = analyzeAbsences("2027-06-01", [{ depart: "2020-01-10", return: "2020-07-09" }]);
  assert.equal(b.anyTripSixMonthsOrMore, false);
  // window clipping: trip that started > 10 years ago counts only inside the window
  const c = analyzeAbsences("2027-06-01", [{ depart: "2017-05-01", return: "2017-06-11" }]);
  assert.equal(c.totalAbsenceDays, 10);
  const revised = checkPr({ route: "general", applicationDate: "2027-06-01", yearsInJapan: 11, workOrResidenceYears: 6, trips: [{ depart: "2020-01-10", return: "2020-07-10" }] });
  assert.equal(get(revised, "absences").status, "issue");
  const old = checkPr({ route: "general", applicationDate: "2027-03-01", yearsInJapan: 11, workOrResidenceYears: 6, trips: [{ depart: "2020-01-10", return: "2020-07-10" }] });
  assert.equal(get(old, "absences").status, "not_considered");
  const total = checkPr({ route: "general", applicationDate: "2027-06-01", yearsInJapan: 11, workOrResidenceYears: 6, longestTripDays: 120, totalAbsenceDays: 950 });
  assert.equal(get(total, "absences").status, "issue");
  const fine = checkPr({ route: "general", applicationDate: "2027-06-01", yearsInJapan: 11, workOrResidenceYears: 6, longestTripDays: 40, totalAbsenceDays: 200 });
  assert.equal(get(fine, "absences").status, "meets");
  assert.throws(() => analyzeAbsences("2027-06-01", [{ depart: "2024-02-01", return: "2024-01-01" }]));
});

test("revised-only factors: B1, rules, schooling, pension not considered before 2027-04-01", () => {
  const old = checkPr({ route: "general", applicationDate: "2026-11-01", japaneseB1: "no", schoolAgeChildren: "not_in_school" });
  for (const id of ["japanese_b1", "rules_understanding", "school_attendance", "pension"]) assert.equal(get(old, id).status, "not_considered", id);
  const rev = checkPr({ route: "general", applicationDate: "2027-04-01", japaneseB1: "no", schoolAgeChildren: "not_in_school" });
  assert.equal(get(rev, "japanese_b1").status, "issue");
  assert.equal(get(rev, "school_attendance").status, "issue");
  assert.equal(get(rev, "pension").status, "review");
  const exempt = checkPr({ route: "hsp70", applicationDate: "2027-04-01", japaneseB1: "no", b1Exemption: "hsp_or_family" });
  assert.equal(get(exempt, "japanese_b1").status, "not_considered");
});

test("income rule applies from 2026-04-01 filings; spouses/refugees exempt from livelihood", () => {
  assert.equal(get(checkPr({ route: "general", applicationDate: "2026-03-15" }), "income").status, "info");
  assert.equal(get(checkPr({ route: "general", applicationDate: "2026-05-15" }), "income").status, "review");
  assert.equal(get(checkPr({ route: "spouse", applicationDate: "2026-05-15" }), "income").status, "not_considered");
  assert.equal(get(checkPr({ route: "refugee", applicationDate: "2027-05-15" }), "pension").status, "not_considered");
});

test("never claims approval; summary values and fee", () => {
  const r = checkPr({ route: "general", applicationDate: "2026-12-01", yearsInJapan: 12, workOrResidenceYears: 8, periodOfStay: "5y", taxesPaidOnTime: "yes", pensionInsurancePaidOnTime: "yes", longestTripDays: 30, totalAbsenceDays: 100 });
  assert.equal(r.summary, "no_objective_blocker");
  assert.ok(!/approved|eligible/i.test(r.summaryLabel));
  assert.equal(r.fee.permanentResidencePermissionJPY, 200000);
  assert.ok(r.notes.some((n) => /discretionary/.test(n)));
  assert.ok(r.keyDates.find((k) => k.date === "2027-03-31"));
});

test("unpaid taxes → issue; bad input throws", () => {
  assert.equal(checkPr({ route: "general", applicationDate: "2026-12-01", taxesPaidOnTime: "no" }).summary, "objective_issue");
  assert.throws(() => checkPr({ route: "general", applicationDate: "2026-02-30" }));
  assert.throws(() => checkPr({ route: "wizard" as never, applicationDate: "2026-12-01" }));
  assert.throws(() => checkPr({ route: "general", applicationDate: "2026-12-01", residenceSince: "yesterday" }));
});

test("rules JSON lists both versions", () => {
  assert.equal(RULES.applicationBands.length, 3);
  const sp = RULES.timeRequirements.find((t) => t.route === "spouse")!;
  assert.match(sp.upTo20270331, /3\+ years and 1\+ year/);
  assert.match(sp.from20270401, /5\+ years and 3\+ years/);
});
