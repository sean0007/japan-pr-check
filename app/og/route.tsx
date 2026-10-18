import { ImageResponse } from "next/og";
import { checkPr } from "@/lib/pr";
import { BAND_SHORT, EXAMPLE_SHARED, ROUTE_SHORT, SUMMARY_COLOR, fmtDate, parseShared, toCheckInput } from "@/lib/share";

export async function GET(req: Request) {
  let shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  let r;
  try {
    r = checkPr(toCheckInput(shared));
  } catch {
    shared = EXAMPLE_SHARED;
    r = checkPr(toCheckInput(shared));
  }
  const fw = r.filingWindow;
  const stats = [
    { label: "application filed", value: fmtDate(shared.applicationDate) },
    { label: "time requirement met", value: r.timeRequirement.earliestDate ? fmtDate(r.timeRequirement.earliestDate) : "—" },
    fw ? { label: "under Apr 2027 rules", value: fw.newRuleEarliest ? fmtDate(fw.newRuleEarliest) : "—" } : { label: "open factors", value: String(r.counts.unknown + r.counts.review) },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan PR Guideline Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>
            {ROUTE_SHORT[shared.route]} · {BAND_SHORT[r.band]}
          </div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 80, fontWeight: 800, letterSpacing: "-0.03em", color: SUMMARY_COLOR[r.summary], lineHeight: 1.05 }}>{r.summaryLabel}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-pr-check.vercel.app · free, no login</span>
          <span>Not legal advice. ISA decides.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
