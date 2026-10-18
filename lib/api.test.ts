import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL, parseTrips } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → transition band, spouse old rule usable`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.band, "transition");
  assert.equal(body.filingWindow.canUseOldRule, true);
  assert.equal(body.timeRequirement.earliestDate, "2026-09-01");
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  const a = await post.json();
  const b = await get.json();
  for (const k of ["keyDates"]) {
    delete a[k];
    delete b[k];
  }
  assert.deepEqual(a, b);
});

test("POST trips array + aliases; GET trips string", async () => {
  const res = await handler(
    new Request(`${PUBLIC_URL}${e.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: "10y", applicationDate: "2027-06-01", yearsInJapan: 11, workYears: 6, currentStatus: "gijinkoku", periodOfStay: "5", trips: [{ depart: "2020-01-10", return: "2020-07-10" }], japaneseB1: true }),
    }),
  );
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.equal(b.route, "general");
  assert.equal(b.absences.anyTripSixMonthsOrMore, true);
  assert.equal(b.summary, "objective_issue");
  assert.deepEqual(parseTrips("2024-01-05_2024-03-01,2025-07-01..2026-02-01"), [
    { depart: "2024-01-05", return: "2024-03-01" },
    { depart: "2025-07-01", return: "2026-02-01" },
  ]);
  const g = await (await handler(new Request(`${PUBLIC_URL}${e.path}?route=general&applicationDate=2027-06-01&trips=2024-01-05_2024-03-01`))).json();
  assert.equal(g.absences.totalAbsenceDays, 56);
});

test("missing route → 400 with example", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /route/);
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.ok(body.example);
});

test("bad inputs → 400", async () => {
  for (const q of ["route=wizard", "route=general&applicationDate=2027-13-01", "route=general&periodOfStay=7y", "route=general&trips=yesterday", "route=general&currentStatus=pirate", "route=general&schoolAgeChildren=maybe", "route=general&yearsInJapan=-3"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST with route required", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string; required?: boolean }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "route")?.required);
});
