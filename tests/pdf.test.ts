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

test("creates a browser-downloadable PDF file", async () => {
  const file = await createQuotePdfFile(quote, "both");

  assert.equal(file.blob.type, "application/pdf");
  assert.match(file.fileName, /^inox-smart-saas-quote-enterprise-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.ok(file.blob.size > 5_000);
});
