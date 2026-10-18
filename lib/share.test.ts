import assert from "node:assert/strict";
import test from "node:test";
import { checkPr } from "./pr";
import { EXAMPLE_GENERAL, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, sharedQuery, toCheckInput } from "./share";

test("examples round-trip and are indexable", () => {
  assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(EXAMPLE_SHARED))), EXAMPLE_SHARED);
  assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(EXAMPLE_GENERAL))), EXAMPLE_GENERAL);
  assert.ok(isIndexable(EXAMPLE_SHARED) && isIndexable(EXAMPLE_GENERAL));
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?c=spouse&d=2027-02-15&s=2025-09-01&m=2023-06-10&p=3y");
});

test("share link → same result as API", () => {
  assert.equal(checkPr(toCheckInput(EXAMPLE_SHARED)).filingWindow?.canUseOldRule, true);
  assert.equal(checkPr(toCheckInput(EXAMPLE_GENERAL)).summary, "objective_issue");
});

test("parseShared rejects junk", () => {
  assert.equal(parseShared({ c: "wizard", d: "2027-01-15" }), null);
  assert.equal(parseShared({ c: "spouse", d: "2027-02-30" }), null);
  assert.equal(parseShared({ c: "spouse" }), null);
  assert.equal(parseShared({}), null);
  assert.equal(parseShared({ c: "general", d: "2027-01-15", p: "9y" })?.periodOfStay, null);
});
