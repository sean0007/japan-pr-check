import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/pr";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational checker. It applies a dated copy (as of {RULES_AS_OF}) of the Immigration Services Agency&apos;s Guidelines for Permission for Permanent Residence (永住許可に関するガイドライン): the version revised on 2026-02-24, the version revised on 2026-10-01, and ISA&apos;s 2026-10-01 notice on which version applies to which filing date. It compares the objective, published parts (time in Japan, work-status years, period of stay, absences, Japanese level, school attendance) with the dates and answers you give.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not immigration or legal advice and it never says you will or will not get permanent residence. Permission is discretionary: ISA weighs your whole record and does not publish its income, pension or asset thresholds. ISA has not yet announced how Japanese B1 and the understanding of Japan&apos;s rules will be assessed. Rules can change and ISA may apply them differently from this tool. Check the official sources below, and ask ISA or a licensed gyoseishoshi (行政書士) or lawyer about your case.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">How dates are counted</h2>
          <p className="mt-2">
            Years are counted as calendar years from the date you give (marriage, start of residence, qualifying date) to the filing date. A trip abroad counts as 6 months or more if you returned on or after the same calendar day 6 months after leaving; 2 years 6 months in total is treated as 913 days. ISA publishes no day-count method, and it treats trips with a reasonable reason (for example a work assignment abroad) differently. Do not plan to the last day.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">Choices you make stay in your browser (or in a share link you create). No login, no residence card numbers, no database.</p>
        </section>
      </div>
    </div>
  );
}
