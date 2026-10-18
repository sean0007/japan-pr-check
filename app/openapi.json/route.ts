import { openapiDoc, preflight, staticJson } from "@/lib/agent-api";
import { API_INFO, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

export function GET() {
  const base = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as {
    paths: Record<string, unknown>;
    [k: string]: unknown;
  };
  base.paths["/api/rules"] = {
    get: {
      operationId: "japanPermanentResidencyRules",
      summary: "Japan permanent residence guideline rules: filing-date bands, time requirements old vs revised, work-status exclusions, 3-year period transition, absence rule, new factors, fee",
      description: "Returns the dated rules of ISA's permanent residence guideline (2026-02-24 and the 2026-10-01 revision) and which applies by filing date, with sources and disclaimer. No inputs.",
      responses: {
        "200": {
          description: "Rules JSON with rulesAsOf and sources.",
          content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
        },
      },
    },
  };
  return staticJson(base);
}
export const OPTIONS = preflight;
