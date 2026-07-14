import { jsPDF } from "jspdf";
import { APP_CONFIG } from "@/app/config/pricing";
import type { PlanQuote } from "@/app/lib/pricing";

export type QuoteDisplayMode = "net" | "msrp" | "both";

const PDF = {
  pageWidth: 612,
  pageHeight: 792,
  margin: 42,
  contentWidth: 528,
  accent: APP_CONFIG.themeColor,
  ink: "#1A1F18",
  text: "#283126",
  muted: "#687064",
  border: "#DCE2D8",
  soft: "#F3F6F0",
  white: "#FFFFFF",
} as const;

function money(amount: number): string {
  return `${APP_CONFIG.currencySymbol}${amount.toFixed(2)}`;
}

function drawLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(PDF.muted);
  doc.text(text.toUpperCase(), x, y);
}

function priceForMode(net: number, mode: QuoteDisplayMode): string {
  const msrp = net * APP_CONFIG.msrpMultiplier;
  if (mode === "net") return `${money(net)} NET`;
  if (mode === "msrp") return `${money(msrp)} MSRP`;
  return `${money(net)} / ${money(msrp)}`;
}

function createQuoteId(date: Date): string {
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const random = new Uint32Array(1);
  globalThis.crypto?.getRandomValues(random);
  const suffix = (random[0] || Math.floor(Math.random() * 46656))
    .toString(36)
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
  return `INOX-${datePart}-${suffix}`;
}

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/brand/inox-smart-logo-dark.png");
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

function drawCapacityTable(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode) {
  const x = PDF.margin;
  const y = 218;
  const widths = [145, 74, 105, 94, 110];
  const headers = [
    "CAPACITY",
    "BASE",
    "ADD-ON CAPACITY",
    "TOTAL INCLUDED",
    mode === "both" ? "ADD-ON NET / MSRP" : `ADD-ON ${mode.toUpperCase()}`,
  ];
  const headerHeight = 22;
  const rowHeight = 24;

  doc.setFillColor(PDF.ink);
  doc.roundedRect(x, y, PDF.contentWidth, headerHeight, 4, 4, "F");

  let cursorX = x;
  headers.forEach((header, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(PDF.white);
    doc.text(header, cursorX + 8, y + 14);
    cursorX += widths[index];
  });

  quote.lines.forEach((line, rowIndex) => {
    const rowY = y + headerHeight + rowIndex * rowHeight;
    if (rowIndex % 2 === 0) {
      doc.setFillColor(PDF.soft);
      doc.rect(x, rowY, PDF.contentWidth, rowHeight, "F");
    }
    doc.setDrawColor(PDF.border);
    doc.line(x, rowY + rowHeight, x + PDF.contentWidth, rowY + rowHeight);

    const values = [
      line.label,
      String(line.baseIncluded),
      line.addonCount > 0
        ? `+${line.addonUnits} (${line.addonCount} x ${line.addonStep})`
        : "—",
      String(line.totalCapacity),
      line.addonCount > 0 ? priceForMode(line.addonNetCost, mode) : "—",
    ];

    let cellX = x;
    values.forEach((value, index) => {
      doc.setFont("helvetica", index === 0 || index === 3 ? "bold" : "normal");
      doc.setFontSize(index === 4 && mode === "both" ? 7 : 8);
      doc.setTextColor(index === 4 && line.addonCount > 0 ? PDF.text : PDF.muted);
      doc.text(value, cellX + 8, rowY + 15.5);
      cellX += widths[index];
    });
  });
}

function drawPricingTable(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);
  const rows = [
    {
      description: `${quote.plan.name} base monthly plan`,
      net: quote.plan.monthlyNet,
    },
    ...activeAddons.map((line) => ({
      description: `${line.label} · +${line.addonUnits} (${line.addonCount} add-on${line.addonCount === 1 ? "" : "s"})`,
      net: line.addonNetCost,
    })),
  ];
  const x = PDF.margin;
  const y = 397;
  const headerHeight = 22;
  const rowHeight = 21;
  const descriptionWidth = mode === "both" ? 330 : 388;
  const priceWidth = (PDF.contentWidth - descriptionWidth) / (mode === "both" ? 2 : 1);

  doc.setFillColor(PDF.soft);
  doc.setDrawColor(PDF.border);
  doc.roundedRect(x, y, PDF.contentWidth, headerHeight, 4, 4, "FD");
  drawLabel(doc, "Description", x + 8, y + 14);

  if (mode === "both") {
    drawLabel(doc, "NET", x + descriptionWidth + 8, y + 14);
    drawLabel(doc, "MSRP", x + descriptionWidth + priceWidth + 8, y + 14);
  } else {
    drawLabel(doc, mode, x + descriptionWidth + 8, y + 14);
  }

  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    doc.setDrawColor(PDF.border);
    doc.line(x, rowY + rowHeight, x + PDF.contentWidth, rowY + rowHeight);
    doc.setFont("helvetica", index === 0 ? "bold" : "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(PDF.text);
    doc.text(row.description, x + 8, rowY + 14);

    if (mode === "both") {
      doc.text(money(row.net), x + descriptionWidth + 8, rowY + 14);
      doc.text(
        money(row.net * APP_CONFIG.msrpMultiplier),
        x + descriptionWidth + priceWidth + 8,
        rowY + 14,
      );
    } else {
      const value = mode === "net" ? row.net : row.net * APP_CONFIG.msrpMultiplier;
      doc.text(money(value), x + descriptionWidth + 8, rowY + 14);
    }
  });
}

function drawTotals(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode) {
  const metrics =
    mode === "both"
      ? [
          ["MONTHLY NET", quote.monthlyNet],
          ["YEARLY NET", quote.yearlyNet],
          ["MONTHLY MSRP", quote.monthlyMsrp],
          ["YEARLY MSRP", quote.yearlyMsrp],
        ] as const
      : mode === "net"
        ? ([
            ["MONTHLY NET", quote.monthlyNet],
            ["YEARLY NET", quote.yearlyNet],
          ] as const)
        : ([
            ["MONTHLY MSRP", quote.monthlyMsrp],
            ["YEARLY MSRP", quote.yearlyMsrp],
          ] as const);

  const y = 584;
  const height = 82;
  const gap = 8;
  const width = (PDF.contentWidth - gap * (metrics.length - 1)) / metrics.length;

  metrics.forEach(([label, amount], index) => {
    const x = PDF.margin + index * (width + gap);
    doc.setFillColor(index === 0 ? PDF.accent : PDF.ink);
    doc.roundedRect(x, y, width, height, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(index === 0 ? PDF.ink : "#B9C1B5");
    doc.text(label, x + 12, y + 23);
    doc.setFontSize(metrics.length === 4 ? 15 : 20);
    doc.setTextColor(index === 0 ? PDF.ink : PDF.white);
    doc.text(money(amount), x + 12, y + 51);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(index === 0 ? "#405016" : "#9EA79A");
    doc.text(APP_CONFIG.currency, x + 12, y + 67);
  });
}

export interface PdfBuildOptions {
  generatedAt?: Date;
  logo?: string | null;
}

export function buildQuotePdfDocument(
  quote: PlanQuote,
  mode: QuoteDisplayMode,
  options: PdfBuildOptions = {},
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const generatedAt = options.generatedAt ?? new Date();
  const quoteId = createQuoteId(generatedAt);
  const logo = options.logo ?? null;

  doc.setProperties({
    title: `${APP_CONFIG.quoteTitle} · ${quote.plan.name}`,
    subject: "SaaS pricing quote",
    author: APP_CONFIG.brandName,
    creator: APP_CONFIG.productName,
  });

  doc.setFillColor(PDF.accent);
  doc.rect(0, 0, PDF.pageWidth, 8, "F");

  if (logo) {
    doc.addImage(logo, "PNG", PDF.margin, 26, 132, 17.5);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(PDF.ink);
    doc.text(APP_CONFIG.brandName, PDF.margin, 42);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(PDF.muted);
  doc.text("SAAS QUOTE", PDF.pageWidth - PDF.margin, 39, { align: "right" });

  doc.setFontSize(23);
  doc.setTextColor(PDF.ink);
  doc.text(APP_CONFIG.quoteTitle, PDF.margin, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(PDF.muted);
  doc.text(APP_CONFIG.quoteSubtitle, PDF.margin, 94);

  doc.setFillColor(PDF.soft);
  doc.setDrawColor(PDF.border);
  doc.roundedRect(PDF.margin, 111, PDF.contentWidth, 70, 6, 6, "FD");

  const summaryColumns = [PDF.margin + 16, PDF.margin + 194, PDF.margin + 353];
  drawLabel(doc, "Selected plan", summaryColumns[0], 132);
  drawLabel(doc, "Quote ID", summaryColumns[1], 132);
  drawLabel(doc, "Generated", summaryColumns[2], 132);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(PDF.ink);
  doc.text(quote.plan.name, summaryColumns[0], 154);
  doc.setFontSize(9);
  doc.text(quoteId, summaryColumns[1], 153);
  doc.text(
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(generatedAt),
    summaryColumns[2],
    153,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(PDF.muted);
  doc.text(`Pricing view: ${mode === "both" ? "NET + MSRP" : mode.toUpperCase()}`, summaryColumns[2], 168);

  drawLabel(doc, "Included capacity", PDF.margin, 207);
  drawCapacityTable(doc, quote, mode);

  drawLabel(doc, "Pricing detail", PDF.margin, 387);
  drawPricingTable(doc, quote, mode);

  drawLabel(doc, "Quote totals", PDF.margin, 574);
  drawTotals(doc, quote, mode);

  doc.setDrawColor(PDF.border);
  doc.line(PDF.margin, 716, PDF.pageWidth - PDF.margin, 716);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(PDF.muted);
  doc.text(
    `All prices are in ${APP_CONFIG.currency}. Add-ons are billed monthly in whole bundles. Annual pricing is monthly pricing × ${APP_CONFIG.monthsPerYear}.`,
    PDF.margin,
    733,
  );
  doc.text(
    `MSRP is ${APP_CONFIG.msrpMultiplier}× NET. This quote was generated from the configured INOX Smart SaaS pricing rules.`,
    PDF.margin,
    746,
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF.ink);
  doc.text(APP_CONFIG.brandName, PDF.margin, 768);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF.muted);
  doc.text("Letter · 8.5 × 11 in · 1 page", PDF.pageWidth - PDF.margin, 768, {
    align: "right",
  });

  return doc;
}

export async function generateQuotePdf(
  quote: PlanQuote,
  mode: QuoteDisplayMode,
): Promise<void> {
  const generatedAt = new Date();
  const logo = await loadLogo();
  const doc = buildQuotePdfDocument(quote, mode, { generatedAt, logo });
  const dateForFile = generatedAt.toISOString().slice(0, 10);
  doc.save(`${APP_CONFIG.quoteFilePrefix}-${quote.plan.id}-${dateForFile}.pdf`);
}
