import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator } from "@/components/calculator";
import { checkPr } from "@/lib/pr";
import { BAND_SHORT, EXAMPLE_SHARED, PUBLIC_URL, ROUTE_SHORT, fmtDate, isIndexable, ogPath, parseShared, resultPath, toCheckInput } from "@/lib/share";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

function safe(shared: NonNullable<ReturnType<typeof parseShared>>) {
  try {
    return checkPr(toCheckInput(shared));
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const shared = parseShared(await searchParams);
  const r = shared ? safe(shared) : null;
  if (!shared || !r) return { title: "Your result", robots: { index: false, follow: true } };
  const title = `${r.summaryLabel}: ${ROUTE_SHORT[shared.route]}, filed ${shared.applicationDate}`;
  const met = r.timeRequirement.earliestDate ? ` Time requirement met from ${r.timeRequirement.earliestDate}.` : "";
  const description = `${BAND_SHORT[r.band]} applies.${met} Rules as of ${r.rulesAsOf}. Educational guide; ISA decides.`;
  const url = `${PUBLIC_URL}${resultPath(shared)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isIndexable(shared) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `Japan PR Guideline Check · ${title}`, description, type: "website", url, images: [{ url: ogPath(shared), width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title: `Japan PR Guideline Check · ${title}`, description, images: [ogPath(shared)] },
  };
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const shared = parseShared(await searchParams);
  if (!shared) redirect("/");
  const r = safe(shared);
  if (!r) redirect("/");
  const tone = r.summary === "objective_issue" ? "text-rose-300" : r.summary === "need_more_info" ? "text-amber" : "text-teal-200";
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Shared result · Japan PR Guideline Check</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          <span className={tone}>{r.summaryLabel}</span> · {ROUTE_SHORT[shared.route]}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Filed {fmtDate(shared.applicationDate)} · {BAND_SHORT[r.band]}
          {r.timeRequirement.earliestDate ? ` · time requirement met from ${fmtDate(r.timeRequirement.earliestDate)}` : ""} · rules as of {r.rulesAsOf}
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-muted underline underline-offset-2 hover:text-foreground">
            ← Start over
          </Link>
          {resultPath(shared) === resultPath(EXAMPLE_SHARED) ? null : (
            <>
              {" · "}
              <Link href={resultPath(EXAMPLE_SHARED)} className="text-muted underline underline-offset-2 hover:text-foreground">
                Open the example
              </Link>
            </>
          )}
        </p>
      </section>
      <section className="mt-8">
        <Calculator initial={shared} />
      </section>
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
        {DISCLAIMER_SHORT} {HONESTY}
      </p>
    </div>
  );
}
