import { jsPDF } from "jspdf";
import { APP_CONFIG } from "@/app/config/pricing";
import type { PlanQuote } from "@/app/lib/pricing";
import {
  calculateContractPricing,
  effectiveBillingMode,
  effectiveTermMonths,
  formatTerm,
  hasBillToOrPlanDetails,
  hasQuoteAdjustments,
  type QuoteAdjustments,
  type QuoteDetails,
} from "@/app/lib/quoteOptions";

export type QuoteDisplayMode = "net" | "msrp" | "both";

const PDF = {
  pageWidth: 612, pageHeight: 792, margin: 42, contentWidth: 528,
  accent: APP_CONFIG.themeColor, ink: "#1A1F18", text: "#283126", muted: "#687064",
  border: "#DCE2D8", soft: "#F3F6F0", white: "#FFFFFF",
} as const;

function money(amount: number) { return `${APP_CONFIG.currencySymbol}${amount.toFixed(2)}`; }

function drawLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.1); doc.setTextColor(PDF.muted); doc.text(text.toUpperCase(), x, y);
}

function priceForMode(net: number, mode: QuoteDisplayMode) {
  const msrp = net * APP_CONFIG.msrpMultiplier;
  if (mode === "net") return `${money(net)} NET`;
  if (mode === "msrp") return `${money(msrp)} MSRP`;
  return `${money(net)} / ${money(msrp)}`;
}

function createQuoteId(date: Date) {
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const random = new Uint32Array(1); globalThis.crypto?.getRandomValues(random);
  const suffix = (random[0] || Math.floor(Math.random() * 46656)).toString(36).slice(-4).toUpperCase().padStart(4, "0");
  return `INOX-${datePart}-${suffix}`;
}

function formatGeneratedDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(date);
}

function formatUtcDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(date);
}

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/brand/inox-smart-logo-dark.png");
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch { return null; }
}

function drawSummary(
  doc: jsPDF, quote: PlanQuote, quoteId: string, generatedAt: Date, mode: QuoteDisplayMode, details: QuoteDetails,
) {
  const hasDetails = hasBillToOrPlanDetails(details);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.6);
  const memoLines = details.memo ? doc.splitTextToSize(details.memo, PDF.contentWidth - 30) : [];
  const billTo = [details.billToName, details.billToCompany, details.billToEmail].filter(Boolean).join(" · ");
  const quotePlan = [details.planStartDate && `Plan start: ${details.planStartDate}`, details.quotedBy && `Quoted by: ${details.quotedBy}`].filter(Boolean).join(" · ");
  doc.setFontSize(8);
  const billToLines = hasDetails ? doc.splitTextToSize(billTo || "—", 155) : [];
  const quotePlanLines = hasDetails ? doc.splitTextToSize(quotePlan || "—", 310) : [];
  const detailLineCount = Math.max(billToLines.length, quotePlanLines.length, 1);
  const summaryHeight = hasDetails ? 103 + (detailLineCount - 1) * 9.2 : 74;
  const memoHeight = memoLines.length > 0 ? 22 + memoLines.length * 10 : 0;
  const x = PDF.margin; const y = 111; const height = summaryHeight + memoHeight;
  doc.setFillColor(PDF.soft); doc.setDrawColor(PDF.border); doc.roundedRect(x, y, PDF.contentWidth, height, 6, 6, "FD");
  const columns = [x + 15, x + 191, x + 350];
  const items = [
    ["Selected plan", quote.plan.name],
    ["Quote ID", quoteId],
    ["Generated", formatGeneratedDate(generatedAt)],
  ];
  items.forEach(([label, value], index) => {
    drawLabel(doc, label, columns[index], y + 19); doc.setFont("helvetica", "bold"); doc.setFontSize(index === 0 ? 13 : 8.5); doc.setTextColor(PDF.ink); doc.text(value, columns[index], y + 39);
  });
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.6); doc.setTextColor(PDF.muted);
  doc.text(`UTC: ${formatUtcDate(generatedAt)}`, columns[2], y + 52);
  doc.setFontSize(7.2);
  doc.text(`Pricing view: ${mode === "both" ? "NET + MSRP" : mode.toUpperCase()}`, columns[2], y + 64);
  if (hasDetails) {
    drawLabel(doc, "Bill to", columns[0], y + 80);
    drawLabel(doc, "Quote plan", columns[1], y + 80);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(PDF.text);
    doc.text(billToLines, columns[0], y + 94);
    doc.text(quotePlanLines, columns[1], y + 94);
  }
  if (memoLines.length > 0) {
    const memoY = y + summaryHeight;
    drawLabel(doc, "Quote memo", columns[0], memoY + 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.6); doc.setTextColor(PDF.text);
    doc.text(memoLines, columns[0], memoY + 27);
  }
  return y + height;
}

function drawCapacityTable(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode, y: number) {
  const x = PDF.margin; const widths = [145, 64, 104, 94, 121]; const headerHeight = 19; const rowHeight = 18;
  const additionalOnly = quote.pricingMethod === "additional-capacity-only";
  const headers = additionalOnly
    ? ["REQUESTED CAPACITY", "ADD-ON BUNDLE", "BILLED CAPACITY", "ADD-ON COUNT", mode === "both" ? "ADD-ON NET / MSRP" : `ADD-ON ${mode.toUpperCase()}`]
    : ["CAPACITY", "BASE", "ADD-ON CAPACITY", "TOTAL INCLUDED", mode === "both" ? "ADD-ON NET / MSRP" : `ADD-ON ${mode.toUpperCase()}`];
  doc.setFillColor(PDF.ink); doc.roundedRect(x, y, PDF.contentWidth, headerHeight, 4, 4, "F");
  let cursorX = x;
  headers.forEach((header, index) => { doc.setFont("helvetica", "bold"); doc.setFontSize(6.1); doc.setTextColor(PDF.white); doc.text(header, cursorX + 7, y + 12); cursorX += widths[index]; });
  quote.lines.forEach((line, rowIndex) => {
    const rowY = y + headerHeight + rowIndex * rowHeight;
    if (rowIndex % 2 === 0) { doc.setFillColor(PDF.soft); doc.rect(x, rowY, PDF.contentWidth, rowHeight, "F"); }
    doc.setDrawColor(PDF.border); doc.line(x, rowY + rowHeight, x + PDF.contentWidth, rowY + rowHeight);
    const values = additionalOnly
      ? [line.label, `+${line.addonStep}`, line.addonCount > 0 ? `+${line.addonUnits}` : "—", line.addonCount > 0 ? `${line.addonCount} × ${line.addonStep}` : "—", line.addonCount > 0 ? priceForMode(line.addonNetCost, mode) : "—"]
      : [line.label, String(line.baseIncluded), line.addonCount > 0 ? `+${line.addonUnits} (${line.addonCount} x ${line.addonStep})` : "—", String(line.totalCapacity), line.addonCount > 0 ? priceForMode(line.addonNetCost, mode) : "—"];
    let cellX = x;
    values.forEach((value, index) => { doc.setFont("helvetica", index === 0 || index === 3 ? "bold" : "normal"); doc.setFontSize(index === 4 && mode === "both" ? 6.5 : 7.3); doc.setTextColor(index === 4 && line.addonCount > 0 ? PDF.text : PDF.muted); doc.text(value, cellX + 7, rowY + 11.7); cellX += widths[index]; });
  });
  return y + headerHeight + quote.lines.length * rowHeight;
}

function drawPricingTable(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode, y: number) {
  const rows = [
    ...(quote.pricingMethod === "standard" ? [{ description: `${quote.plan.name} base monthly plan`, net: quote.baseMonthlyNet }] : []),
    ...quote.lines.filter((line) => line.addonCount > 0).map((line) => ({ description: `${line.label} · +${line.addonUnits} (${line.addonCount} add-on${line.addonCount === 1 ? "" : "s"})`, net: line.addonNetCost })),
  ];
  const x = PDF.margin; const headerHeight = 19; const rowHeight = 17; const descriptionWidth = mode === "both" ? 330 : 388; const priceWidth = (PDF.contentWidth - descriptionWidth) / (mode === "both" ? 2 : 1);
  doc.setFillColor(PDF.soft); doc.setDrawColor(PDF.border); doc.roundedRect(x, y, PDF.contentWidth, headerHeight, 4, 4, "FD"); drawLabel(doc, "Description", x + 7, y + 12);
  if (mode === "both") { drawLabel(doc, "NET", x + descriptionWidth + 7, y + 12); drawLabel(doc, "MSRP", x + descriptionWidth + priceWidth + 7, y + 12); } else drawLabel(doc, mode, x + descriptionWidth + 7, y + 12);
  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight; doc.setDrawColor(PDF.border); doc.line(x, rowY + rowHeight, x + PDF.contentWidth, rowY + rowHeight); doc.setFont("helvetica", index === 0 && quote.pricingMethod === "standard" ? "bold" : "normal"); doc.setFontSize(7.5); doc.setTextColor(PDF.text); doc.text(row.description, x + 7, rowY + 11.2);
    if (mode === "both") { doc.text(money(row.net), x + descriptionWidth + 7, rowY + 11.2); doc.text(money(row.net * APP_CONFIG.msrpMultiplier), x + descriptionWidth + priceWidth + 7, rowY + 11.2); } else doc.text(money(mode === "net" ? row.net : row.net * APP_CONFIG.msrpMultiplier), x + descriptionWidth + 7, rowY + 11.2);
  });
  return y + headerHeight + rows.length * rowHeight;
}

function drawContractSummary(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode, adjustments: QuoteAdjustments, y: number) {
  if (!hasQuoteAdjustments(adjustments)) return y;
  const net = calculateContractPricing(quote.monthlyNet, adjustments); const msrp = calculateContractPricing(quote.monthlyMsrp, adjustments); const x = PDF.margin; const height = 76;
  doc.setFillColor(PDF.soft); doc.setDrawColor(PDF.border); doc.roundedRect(x, y, PDF.contentWidth, height, 5, 5, "FD");
  drawLabel(doc, "Contract quote", x + 9, y + 14);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(PDF.text); doc.text(formatTerm(adjustments), x + 105, y + 14);
  const rows = [
    ["Term total", net.termTotal, msrp.termTotal],
    ...(net.percentageDiscount > 0 ? [[`${net.discountPercent}% term discount`, -net.percentageDiscount, -msrp.percentageDiscount]] : []),
    ...(net.complimentaryCredit > 0 ? [[`${net.complimentaryMonths} complimentary month${net.complimentaryMonths === 1 ? "" : "s"}`, -net.complimentaryCredit, -msrp.complimentaryCredit]] : []),
    ["Total due", net.totalDue, msrp.totalDue],
  ] as const;
  const useRows = rows;
  const baseY = y + 29;
  if (mode === "both") {
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(PDF.muted); doc.text("NET", x + 365, y + 14); doc.text("MSRP", x + 448, y + 14);
    useRows.forEach(([label, netAmount, msrpAmount], index) => { const rowY = baseY + index * 12; doc.setFont("helvetica", index === useRows.length - 1 ? "bold" : "normal"); doc.setFontSize(7.4); doc.setTextColor(index === useRows.length - 1 ? PDF.ink : PDF.muted); doc.text(label, x + 9, rowY); doc.text(`${netAmount < 0 ? "-" : ""}${money(Math.abs(netAmount))}`, x + 365, rowY); doc.text(`${msrpAmount < 0 ? "-" : ""}${money(Math.abs(msrpAmount))}`, x + 448, rowY); });
  } else {
    const values = mode === "net" ? useRows.map(([label, amount]) => [label, amount] as const) : useRows.map(([label, , amount]) => [label, amount] as const);
    values.forEach(([label, amount], index) => { const rowY = baseY + index * 12; doc.setFont("helvetica", index === values.length - 1 ? "bold" : "normal"); doc.setFontSize(7.6); doc.setTextColor(index === values.length - 1 ? PDF.ink : PDF.muted); doc.text(label, x + 9, rowY); doc.text(`${amount < 0 ? "-" : ""}${money(Math.abs(amount))} ${mode.toUpperCase()}`, PDF.pageWidth - PDF.margin - 9, rowY, { align: "right" }); });
  }
  return y + height;
}

function drawTotals(doc: jsPDF, quote: PlanQuote, mode: QuoteDisplayMode, adjustments: QuoteAdjustments, y: number) {
  const monthlyBilling = effectiveBillingMode(adjustments) === "monthly";
  const termMonths = effectiveTermMonths(adjustments);
  const termLabel = `${termMonths} MONTH${termMonths === 1 ? "" : "S"}`;
  const netTermDue = calculateContractPricing(quote.monthlyNet, adjustments).totalDue;
  const msrpTermDue = calculateContractPricing(quote.monthlyMsrp, adjustments).totalDue;
  const netPeriodMetric = monthlyBilling ? [`${termLabel} NET`, netTermDue] as const : ["YEARLY NET", quote.yearlyNet] as const;
  const msrpPeriodMetric = monthlyBilling ? [`${termLabel} MSRP`, msrpTermDue] as const : ["YEARLY MSRP", quote.yearlyMsrp] as const;
  const metrics = mode === "both" ? [["MONTHLY NET", quote.monthlyNet], netPeriodMetric, ["MONTHLY MSRP", quote.monthlyMsrp], msrpPeriodMetric] as const : mode === "net" ? [["MONTHLY NET", quote.monthlyNet], netPeriodMetric] as const : [["MONTHLY MSRP", quote.monthlyMsrp], msrpPeriodMetric] as const;
  const height = 53; const gap = 7; const width = (PDF.contentWidth - gap * (metrics.length - 1)) / metrics.length;
  metrics.forEach(([label, amount], index) => { const x = PDF.margin + index * (width + gap); doc.setFillColor(index === 0 ? PDF.accent : PDF.ink); doc.roundedRect(x, y, width, height, 6, 6, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(6.2); doc.setTextColor(index === 0 ? PDF.ink : "#B9C1B5"); doc.text(label, x + 9, y + 17); doc.setFontSize(metrics.length === 4 ? 13 : 18); doc.setTextColor(index === 0 ? PDF.ink : PDF.white); doc.text(money(amount), x + 9, y + 36); });
  return y + height;
}

export interface PdfBuildOptions { adjustments?: QuoteAdjustments; details?: QuoteDetails; generatedAt?: Date; logo?: string | null; }
export interface QuotePdfFile { blob: Blob; fileName: string; }

export function buildQuotePdfDocument(quote: PlanQuote, mode: QuoteDisplayMode, options: PdfBuildOptions = {}): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" }); const generatedAt = options.generatedAt ?? new Date(); const quoteId = createQuoteId(generatedAt); const details = options.details ?? { billToCompany: "", billToEmail: "", billToName: "", memo: "", planStartDate: "", quotedBy: "" }; const adjustments = options.adjustments ?? {};
  doc.setProperties({ title: `${APP_CONFIG.quoteTitle} · ${quote.plan.name}`, subject: "SaaS pricing quote", author: APP_CONFIG.brandName, creator: APP_CONFIG.productName });
  doc.setFillColor(PDF.accent); doc.rect(0, 0, PDF.pageWidth, 8, "F");
  if (options.logo) doc.addImage(options.logo, "PNG", PDF.margin, 26, 132, 17.5); else { doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(PDF.ink); doc.text(APP_CONFIG.brandName, PDF.margin, 42); }
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(PDF.muted); doc.text("SAAS QUOTE", PDF.pageWidth - PDF.margin, 39, { align: "right" }); doc.setFontSize(22); doc.setTextColor(PDF.ink); doc.text(APP_CONFIG.quoteTitle, PDF.margin, 78); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(PDF.muted); doc.text(APP_CONFIG.quoteSubtitle, PDF.margin, 94);
  let y = drawSummary(doc, quote, quoteId, generatedAt, mode, details) + 18;
  drawLabel(doc, quote.pricingMethod === "additional-capacity-only" ? "Additional capacity" : "Included capacity", PDF.margin, y - 8); y = drawCapacityTable(doc, quote, mode, y) + 20;
  drawLabel(doc, quote.pricingMethod === "additional-capacity-only" ? "Additional capacity pricing" : "Pricing detail", PDF.margin, y - 8); y = drawPricingTable(doc, quote, mode, y) + 18;
  y = drawContractSummary(doc, quote, mode, adjustments, y) + (hasQuoteAdjustments(adjustments) ? 17 : 0);
  drawLabel(doc, "Quote totals", PDF.margin, y - 8); y = drawTotals(doc, quote, mode, adjustments, y) + 16;
  doc.setFillColor(PDF.soft); doc.setDrawColor(PDF.border); doc.roundedRect(PDF.margin, y, PDF.contentWidth, 22, 5, 5, "FD"); doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); doc.setTextColor(PDF.text); doc.text("FOR REFERENCE ONLY - This quote is not a formal invoice or binding offer.", PDF.pageWidth / 2, y + 14, { align: "center" });
  const footerY = Math.min(PDF.pageHeight - 20, y + 46); doc.setDrawColor(PDF.border); doc.line(PDF.margin, footerY - 13, PDF.pageWidth - PDF.margin, footerY - 13); doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(PDF.muted); doc.text(`All prices are in ${APP_CONFIG.currency}. Add-ons are billed monthly in whole bundles. Annual pricing is monthly pricing × ${APP_CONFIG.monthsPerYear}.`, PDF.margin, footerY);
  if (quote.pricingMethod === "additional-capacity-only") doc.text("Existing plan base fee and included capacity are excluded from this quote.", PDF.margin, footerY + 11);
  if (mode !== "msrp") doc.text(`MSRP is ${APP_CONFIG.msrpMultiplier}× NET. This quote was generated from the configured INOX Smart SaaS pricing rules.`, PDF.margin, footerY + (quote.pricingMethod === "additional-capacity-only" ? 22 : 11));
  doc.setFont("helvetica", "bold"); doc.setTextColor(PDF.ink); doc.text(APP_CONFIG.brandName, PDF.margin, PDF.pageHeight - 12); doc.setFont("helvetica", "normal"); doc.setTextColor(PDF.muted); doc.text("Letter · 8.5 × 11 in · 1 page", PDF.pageWidth - PDF.margin, PDF.pageHeight - 12, { align: "right" });
  return doc;
}

export async function createQuotePdfFile(quote: PlanQuote, mode: QuoteDisplayMode, options: Omit<PdfBuildOptions, "generatedAt" | "logo"> = {}): Promise<QuotePdfFile> {
  const generatedAt = new Date(); const logo = await loadLogo(); const doc = buildQuotePdfDocument(quote, mode, { ...options, generatedAt, logo }); const dateForFile = generatedAt.toISOString().slice(0, 10);
  return { blob: doc.output("blob"), fileName: `${APP_CONFIG.quoteFilePrefix}-${quote.plan.id}-${dateForFile}.pdf` };
}

export function downloadQuotePdfFile(file: QuotePdfFile): void { const url = URL.createObjectURL(file.blob); const link = document.createElement("a"); link.download = file.fileName; link.href = url; link.style.display = "none"; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
export async function generateQuotePdf(quote: PlanQuote, mode: QuoteDisplayMode): Promise<void> { downloadQuotePdfFile(await createQuotePdfFile(quote, mode)); }
