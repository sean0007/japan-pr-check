# Japan PR Guideline Check

Free checker for Japan's **permanent residence guideline (永住許可に関するガイドライン)**, revised by the Immigration Services Agency on **2026-10-01**: which version applies to your filing date, when you meet the time-in-Japan requirement, and which of the objective factors are open.

- Live: https://japan-pr-check.vercel.app
- API: `GET/POST /api/check`, `GET /api/rules`
- Agent docs: `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`
- MCP tool: `japan_permanent_residency_check` on https://free-agent-tools.vercel.app/mcp

**Educational guide, not immigration or legal advice.** Permanent residence is discretionary; ISA decides and does not publish its income thresholds. The tool never predicts approval.

## Example

```
GET https://japan-pr-check.vercel.app/api/check?route=spouse&applicationDate=2027-02-15&residenceSince=2025-09-01&marriageDate=2023-06-10&periodOfStay=3y
```
→ `band: "transition"`, time requirement met from 2026-09-01; under the 2027-04-01 rules not until 2028-09-01 → `canUseOldRule: true` (file by 2027-03-31).

## Rules implemented (verified 2026-10-18)

| Filed | Guideline applied |
|---|---|
| up to 2026-03-31 | 2026-02-24 guideline |
| 2026-04-01 → 2027-03-31 | 2026-02-24 guideline + revised 2(4)(2) income and 2(5)(7) public burden |
| from 2027-04-01 | 2026-10-01 revised guideline in full |

- Spouse 3y marriage + 1y residence → 5y + 3y; child 1y → 3y; general 10y with 5y on a work/residence status (ICT, 育成就労 and some Designated Activities stop counting from 2027-04-01).
- 3-year period of stay: counts until 2027-03-31; after that only for the first PR filing by someone who held it on 2027-03-31, decided before it expires.
- From 2027-04-01: 6-month single trip / 2.5-year total absence (10-year window), Japanese B1 (with exemptions), rules understanding, pension adequacy, school attendance.
- Fee ¥200,000 (applications from 2026-10-01).

Sources: ISA [10_00279](https://www.moj.go.jp/isa/10_00279.html), [PDF 001471577](https://www.moj.go.jp/isa/content/001471577.pdf), [eizyuu_00001](https://www.moj.go.jp/isa/applications/procedures/eizyuu_00001.html), [old guideline](https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html), [public comments](https://public-comment.e-gov.go.jp/pcm/1040?CLASSNAME=PCM1040&id=315000140&Mode=1).

## Dev

```
npm ci
npm test
npm run build
```
