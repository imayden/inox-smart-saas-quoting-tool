import { readFile, writeFile } from "node:fs/promises";
import { PRICING_PLANS } from "../app/config/pricing";
import { calculatePlanQuote, createEmptyRequirements } from "../app/lib/pricing";
import { buildQuotePdfDocument } from "../app/pdf/generateQuotePdf";

const quote = calculatePlanQuote(
  {
    ...createEmptyRequirements(),
    devices: 33,
    mobile: 31,
    ekeys: 315,
    properties: 17,
    saasLogins: 16,
  },
  PRICING_PLANS[1],
);

const logoBytes = await readFile("public/brand/inox-smart-logo-dark.png");
const logo = `data:image/png;base64,${logoBytes.toString("base64")}`;
const pdf = buildQuotePdfDocument(quote, "both", {
  generatedAt: new Date(),
  logo,
});

await writeFile(
  "outputs/inox-smart-saas-quote-sample.pdf",
  Buffer.from(pdf.output("arraybuffer")),
);

console.log("Sample PDF created: outputs/inox-smart-saas-quote-sample.pdf");
