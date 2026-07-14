# INOX Smart SaaS Quoting Tool

A configurable INOX Smart SaaS pricing calculator with automatic best-plan matching and branded single-page PDF quote export.

## Edit pricing and content in VS Code

The business-editable configuration is intentionally centralized in:

```text
app/config/pricing.ts
```

From that file you can change:

- Brand and product names
- Theme color and PDF title
- NET add-on price and MSRP multiplier
- Plan names and monthly NET prices
- Included capacity for every plan
- Add-on bundle size for every capacity type
- Capacity labels shown on the webpage and PDF

Plan order is meaningful: if calculated prices tie, the first plan wins. Keep the order `Elite`, `Professional`, `Enterprise` to preserve the original tie behavior.

## Project structure

```text
app/config/pricing.ts               Business-editable pricing and copy
app/lib/pricing.ts                  Pure calculation and auto-match logic
app/components/                     Reusable interface components and CSS modules
app/pdf/generateQuotePdf.ts         Letter-size PDF renderer
tests/pricing.test.ts               Pricing compatibility tests
tests/rendered-html.test.mjs        Built-page smoke test
```

## Original pricing behavior preserved

For each capacity type:

```text
add-on bundles = ceil((required - included) / add-on step)
monthly NET = plan base NET + total add-on bundles × $5
monthly MSRP = monthly NET × 2
annual price = monthly price × 12
```

No add-on is charged when required capacity is within the base plan. The calculator evaluates every plan and selects the lowest monthly NET. A strict less-than comparison preserves the original first-plan-wins tie behavior.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm test
npm run lint
```

## PDF quote

The browser generates the PDF locally without sending quote data to a server. Each export is:

- English
- US Letter size (8.5 × 11 inches)
- One page
- Branded with `#80C41C`
- Available as NET only, MSRP only, or NET + MSRP

## Netlify

The repository includes Netlify build settings. Connect the GitHub repository in Netlify and deploy with the included configuration.
