"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  createQuotePdfFile,
  downloadQuotePdfFile,
  type QuoteDisplayMode,
} from "@/app/pdf/generateQuotePdf";
import { APP_CONFIG } from "@/app/config/pricing";
import { formatCurrency, type PlanQuote } from "@/app/lib/pricing";
import {
  calculateContractPricing,
  formatTerm,
  hasQuoteAdjustments,
  hasBillToOrPlanDetails,
  type QuoteAdjustments,
  type QuoteDetails,
} from "@/app/lib/quoteOptions";
import styles from "./DownloadQuote.module.css";

const MODES: readonly {
  value: QuoteDisplayMode;
  title: string;
  description: string;
}[] = [
  { value: "net", title: "NET only", description: "Partner monthly and annual pricing" },
  { value: "msrp", title: "MSRP only", description: "Customer-facing monthly and annual pricing" },
  { value: "both", title: "MSRP + NET", description: "Show both price levels side by side" },
];

interface DownloadQuoteProps {
  adjustments: QuoteAdjustments;
  onQuoteDetailsChange: (details: QuoteDetails) => void;
  quote: PlanQuote;
  quoteDetails: QuoteDetails;
  variant?: "default" | "dock" | "workspace";
  fixedMode?: QuoteDisplayMode;
}

interface ReadyPdf {
  fileName: string;
  generatedOn: string;
  quoteKey: string;
  url: string;
}

function subscribeToEmbeddingState() {
  return () => undefined;
}

function pricingViewLabel(mode: QuoteDisplayMode) {
  return mode === "both" ? "NET + MSRP" : mode.toUpperCase();
}

function QuotePreview({
  adjustments,
  details,
  file,
  mode,
  quote,
}: {
  adjustments: QuoteAdjustments;
  details: QuoteDetails;
  file: ReadyPdf;
  mode: QuoteDisplayMode;
  quote: PlanQuote;
}) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);
  const additionalCapacityOnly = quote.pricingMethod === "additional-capacity-only";
  const netContract = calculateContractPricing(quote.monthlyNet, adjustments);
  const msrpContract = calculateContractPricing(quote.monthlyMsrp, adjustments);
  const contract = mode === "net" ? netContract : msrpContract;
  const pricingRows = [
    ...(additionalCapacityOnly ? [] : [{ description: `${quote.plan.name} base monthly plan`, net: quote.baseMonthlyNet }]),
    ...activeAddons.map((line) => ({
      description: `${line.label} · +${line.addonUnits} (${line.addonCount} add-on${line.addonCount === 1 ? "" : "s"})`,
      net: line.addonNetCost,
    })),
  ];

  return (
    <article className={styles.previewSheet} aria-label="Generated quote preview">
      <header className={styles.sheetHeader}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="INOX Smart" src="/brand/inox-smart-logo-dark.png" />
        <span>SaaS Quote</span>
      </header>
      <div className={styles.sheetTitle}>
        <h3>{APP_CONFIG.quoteTitle}</h3>
        <p>{APP_CONFIG.quoteSubtitle}</p>
      </div>
      <dl className={styles.sheetSummary}>
        <div><dt>Selected plan</dt><dd>{quote.plan.name}</dd></div>
        <div><dt>Generated</dt><dd>{file.generatedOn}</dd></div>
        <div><dt>Pricing view</dt><dd>{pricingViewLabel(mode)}</dd></div>
        {details.planStartDate && <div><dt>Plan start</dt><dd>{details.planStartDate}</dd></div>}
        {details.quotedBy && <div><dt>Quoted by</dt><dd>{details.quotedBy}</dd></div>}
      </dl>
      {hasBillToOrPlanDetails(details) && (
        <section className={styles.sheetBlock}>
          <h4>Bill to</h4>
          <p className={styles.billToPreview}>
            {[details.billToName, details.billToCompany, details.billToEmail].filter(Boolean).join(" · ") || "—"}
          </p>
        </section>
      )}
      {details.memo && (
        <section className={styles.sheetBlock}>
          <h4>Quote memo</h4>
          <p className={styles.memoPreview}>{details.memo}</p>
        </section>
      )}
      <section className={styles.sheetBlock}>
        <h4>{additionalCapacityOnly ? "Additional capacity" : "Included capacity"}</h4>
        {additionalCapacityOnly && <p className={styles.modeNote}>Existing plan base fee and included capacity are excluded from this quote.</p>}
        <div className={styles.tableScroll}>
          <table>
            <thead><tr>{additionalCapacityOnly ? <><th>Capacity</th><th>Bundle</th><th>Billed capacity</th><th>Add-on count</th></> : <><th>Capacity</th><th>Base</th><th>Add-on capacity</th><th>Total included</th></>}<th>Add-on {pricingViewLabel(mode)}</th></tr></thead>
            <tbody>{quote.lines.map((line) => (
              <tr key={line.key}>
                <th scope="row">{line.label}</th>
                {additionalCapacityOnly ? <><td>+{line.addonStep}</td><td>{line.addonCount > 0 ? `+${line.addonUnits}` : "—"}</td><td>{line.addonCount > 0 ? `${line.addonCount} × ${line.addonStep}` : "—"}</td></> : <><td>{line.baseIncluded}</td><td>{line.addonCount > 0 ? `+${line.addonUnits} (${line.addonCount} × ${line.addonStep})` : "—"}</td><td>{line.totalCapacity}</td></>}
                <td>{line.addonCount === 0 ? "—" : mode === "both" ? `${formatCurrency(line.addonNetCost)} / ${formatCurrency(line.addonMsrpCost)}` : formatCurrency(mode === "net" ? line.addonNetCost : line.addonMsrpCost)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className={styles.sheetBlock}>
        <h4>{additionalCapacityOnly ? "Additional capacity pricing" : "Pricing detail"}</h4>
        <div className={styles.tableScroll}>
          <table>
            <thead><tr><th>Description</th>{mode !== "msrp" && <th>NET</th>}{mode !== "net" && <th>MSRP</th>}</tr></thead>
            <tbody>{pricingRows.map((row) => (
              <tr key={row.description}><th scope="row">{row.description}</th>{mode !== "msrp" && <td>{formatCurrency(row.net)}</td>}{mode !== "net" && <td>{formatCurrency(row.net * APP_CONFIG.msrpMultiplier)}</td>}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className={styles.sheetTotals} aria-label="Quote totals">
        <div className={styles.primaryTotal}><span>{mode === "msrp" ? "Monthly MSRP" : "Monthly NET"}</span><strong>{formatCurrency(mode === "msrp" ? quote.monthlyMsrp : quote.monthlyNet)}</strong><small>{APP_CONFIG.currency}</small></div>
        <div><span>{mode === "msrp" ? "Yearly MSRP" : "Yearly NET"}</span><strong>{formatCurrency(mode === "msrp" ? quote.yearlyMsrp : quote.yearlyNet)}</strong><small>{APP_CONFIG.currency}</small></div>
        {hasQuoteAdjustments(adjustments) && <div><span>{formatTerm(adjustments)} total due</span><strong>{formatCurrency(contract.totalDue)}</strong><small>{mode === "msrp" ? "MSRP" : "NET"}</small></div>}
      </section>
      <p className={styles.sheetDisclaimer}><strong>For reference only</strong> — This quote is not a formal invoice or binding offer.</p>
      <footer className={styles.sheetFooter}><span>{APP_CONFIG.brandName}</span><span>Letter · 8.5 × 11 in · 1 page</span></footer>
    </article>
  );
}

function downloadButtonLabel(mode: QuoteDisplayMode) {
  if (mode === "net") return "Download NET PDF Quote";
  if (mode === "msrp") return "Download MSRP PDF Quote";
  return "Download NET + MSRP PDF Quote";
}

export function DownloadQuote({
  adjustments,
  fixedMode,
  onQuoteDetailsChange,
  quote,
  quoteDetails,
  variant = "default",
}: DownloadQuoteProps) {
  const [mode, setMode] = useState<QuoteDisplayMode>("both");
  const selectedMode = fixedMode ?? mode;
  const [isGenerating, setIsGenerating] = useState(false);
  const isEmbedded = useSyncExternalStore(subscribeToEmbeddingState, () => window.self !== window.top, () => false);
  const [readyPdf, setReadyPdf] = useState<ReadyPdf | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const quoteKey = useMemo(() => JSON.stringify({
    mode: selectedMode, plan: quote.plan.id, requirements: quote.lines.map((line) => line.required), adjustments, quoteDetails,
  }), [adjustments, quote, quoteDetails, selectedMode]);
  const currentReadyPdf = readyPdf?.quoteKey === quoteKey ? readyPdf : null;

  useEffect(() => () => { if (readyPdf) URL.revokeObjectURL(readyPdf.url); }, [readyPdf]);

  function updateDetails(update: Partial<QuoteDetails>) {
    onQuoteDetailsChange({ ...quoteDetails, ...update });
    setShowPreview(false);
    setError("");
  }

  async function handleDownload() {
    const embedded = window.self !== window.top;
    setIsGenerating(true);
    setError("");
    try {
      const file = await createQuotePdfFile(quote, selectedMode, { adjustments, details: quoteDetails });
      if (!embedded) { downloadQuotePdfFile(file); return; }
      setReadyPdf({
        fileName: file.fileName,
        generatedOn: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
        quoteKey,
        url: URL.createObjectURL(file.blob),
      });
      setShowPreview(true);
    } catch { setError("The PDF could not be generated. Please try again."); }
    finally { setIsGenerating(false); }
  }

  return (
    <section className={`${styles.section} ${variant === "dock" ? styles.dock : ""} ${variant === "workspace" ? styles.workspace : ""}`} aria-labelledby="download-heading">
      <div className={styles.copy}>
        <p className="section-kicker">Step 03</p><h2 id="download-heading">Download Quote</h2>
        <p>Export the selected plan, included capacity, optional term incentives, and pricing as a branded English Letter PDF.</p>
      </div>
      {!fixedMode && <fieldset className={styles.options}>
        <legend>Choose pricing visibility</legend>
        {MODES.map((option) => <label className={styles.option} key={option.value}>
          <input checked={selectedMode === option.value} name="quote-display-mode" onChange={() => { setMode(option.value); setShowPreview(false); setError(""); }} type="radio" value={option.value} />
          <span className={styles.radioMark} aria-hidden="true" /><span><strong>{option.title}</strong><small>{option.description}</small></span>
        </label>)}
      </fieldset>}
      <details className={styles.quoteInformation}>
        <summary><span>Quote information <small>Optional · included in the PDF only when entered</small></span><span aria-hidden="true">⌄</span></summary>
        <div className={styles.informationBody}>
          <fieldset><legend>Bill to</legend>
            <label><span>Customer name</span><input onChange={(event) => updateDetails({ billToName: event.target.value })} placeholder="Customer name" value={quoteDetails.billToName} /></label>
            <label><span>Company / organization</span><input onChange={(event) => updateDetails({ billToCompany: event.target.value })} placeholder="Company or organization" value={quoteDetails.billToCompany} /></label>
            <label><span>Customer email</span><input onChange={(event) => updateDetails({ billToEmail: event.target.value })} placeholder="name@company.com" type="email" value={quoteDetails.billToEmail} /></label>
          </fieldset>
          <fieldset><legend>Quote plan</legend>
            <label><span>Plan start date</span><input onChange={(event) => updateDetails({ planStartDate: event.target.value })} type="date" value={quoteDetails.planStartDate} /></label>
            <label><span>Quoted by</span><input onChange={(event) => updateDetails({ quotedBy: event.target.value })} placeholder="Name" value={quoteDetails.quotedBy} /></label>
          </fieldset>
          <label className={styles.memoField}>
            <span>Memo <small>{quoteDetails.memo.length}/200</small></span>
            <textarea
              maxLength={200}
              onChange={(event) => updateDetails({ memo: event.target.value.slice(0, 200) })}
              placeholder="Optional note to include in the PDF"
              rows={3}
              value={quoteDetails.memo}
            />
          </label>
        </div>
      </details>
      <div className={styles.action}>
        <div><span>Selected quote</span><strong>{quote.plan.name}</strong></div>
        {isEmbedded && currentReadyPdf ? <>
          <a className={styles.downloadButton} download={currentReadyPdf.fileName} href={currentReadyPdf.url} onClick={(event) => { event.preventDefault(); setShowPreview(true); }}>Right-click to Open PDF</a>
          <button className={styles.secondaryButton} disabled={isGenerating} onClick={handleDownload} type="button">{isGenerating ? "Rebuilding PDF…" : "Rebuild PDF Quote"}</button>
        </> : <button disabled={isGenerating} onClick={handleDownload} type="button">{isGenerating ? "Creating PDF…" : isEmbedded ? "Prepare PDF Quote" : downloadButtonLabel(selectedMode)}</button>}
        {isEmbedded && !currentReadyPdf && !error && <p className={styles.embedNote}>Lark blocks automatic new tabs. Prepare the PDF to preview it inside this card.</p>}
        {isEmbedded && currentReadyPdf && <p className={styles.pdfReady}>PDF ready. Use the preview below, or right-click the green link and choose Open Link in New Tab.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      <p className={styles.disclaimer}>For package configuration and pricing reference only. This quote is not a formal invoice or binding offer.</p>
      {isEmbedded && currentReadyPdf && showPreview && <div className={styles.preview}>
        <div className={styles.previewHeader}><div><span>Quote preview</span><strong>{currentReadyPdf.fileName}</strong></div><button onClick={() => setShowPreview(false)} type="button">Close preview</button></div>
        <QuotePreview adjustments={adjustments} details={quoteDetails} file={currentReadyPdf} mode={selectedMode} quote={quote} />
      </div>}
    </section>
  );
}
