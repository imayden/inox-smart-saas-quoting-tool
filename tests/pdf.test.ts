import assert from "node:assert/strict";
import test from "node:test";
import { PRICING_PLANS } from "../app/config/pricing";
import { calculatePlanQuote, createEmptyRequirements } from "../app/lib/pricing";
import {
  buildQuotePdfDocument,
  createQuotePdfFile,
  type QuoteDisplayMode,
} from "../app/pdf/generateQuotePdf";

const quote = calculatePlanQuote(
  {
    ...createEmptyRequirements(),
    devices: 133,
    mobile: 118,
    ekeys: 675,
    properties: 34,
    saasLogins: 31,
  },
  PRICING_PLANS[2],
);

for (const mode of ["net", "msrp", "both"] as const satisfies readonly QuoteDisplayMode[]) {
  test(`${mode} PDF is a single US Letter page`, () => {
    const pdf = buildQuotePdfDocument(quote, mode, {
      generatedAt: new Date("2026-07-14T12:00:00Z"),
    });

    assert.equal(pdf.getNumberOfPages(), 1);
    assert.equal(Math.round(pdf.internal.pageSize.getWidth()), 612);
    assert.equal(Math.round(pdf.internal.pageSize.getHeight()), 792);

    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "%PDF");
    assert.ok(bytes.byteLength > 5_000);
  });
}

for (const mode of ["net", "both"] as const satisfies readonly QuoteDisplayMode[]) {
  test(`${mode} PDF includes the partner pricing relationship`, () => {
    const pdf = buildQuotePdfDocument(quote, mode, {
      generatedAt: new Date("2026-07-14T12:00:00Z"),
    });

    assert.match(
      pdf.output(),
      /MSRP is 2× NET\. This quote was generated from the configured INOX Smart SaaS pricing rules\./,
    );
  });
}

test("MSRP-only PDF does not expose NET pricing or calculation logic", () => {
  const pdf = buildQuotePdfDocument(quote, "msrp", {
    generatedAt: new Date("2026-07-14T12:00:00Z"),
  });
  const output = pdf.output();

  assert.doesNotMatch(output, /\bNET\b/);
  assert.doesNotMatch(output, /MSRP is 2×/);
  assert.doesNotMatch(output, /configured INOX Smart SaaS pricing rules/);
});

test("creates a browser-downloadable PDF file", async () => {
  const file = await createQuotePdfFile(quote, "both");

  assert.equal(file.blob.type, "application/pdf");
  assert.match(file.fileName, /^inox-smart-saas-quote-enterprise-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.ok(file.blob.size > 5_000);
});

test("PDF includes optional contract incentives and quote information", () => {
  const pdf = buildQuotePdfDocument(quote, "both", {
    adjustments: { complimentaryMonths: 2, discountPercent: 20, termYears: 5 },
    details: {
      billToCompany: "Unison Hardware",
      billToEmail: "customer@example.com",
      billToName: "Sample Customer",
      memo: "Implementation guidance for the customer onboarding schedule. ".repeat(8).slice(0, 200),
      planStartDate: "2026-08-01",
      quotedBy: "Ayden Deng",
    },
    generatedAt: new Date("2026-07-14T12:00:00Z"),
  });
  const output = pdf.output();
  assert.equal(pdf.getNumberOfPages(), 1);
  assert.match(output, /CONTRACT QUOTE/);
  assert.match(output, /5 years \\\((60 months)\\\)/);
  assert.doesNotMatch(output, /5 years · 60 months/);
  assert.match(output, /20% term discount/);
  assert.match(output, /complimentary months/);
  assert.match(output, /Sample Customer/);
  assert.match(output, /Ayden Deng/);
  assert.match(output, /QUOTE MEMO/);
  assert.match(output, /Implementation guidance/);
});
