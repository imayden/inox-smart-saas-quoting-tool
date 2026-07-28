"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  createQuotePdfFile,
  downloadQuotePdfFile,
  type QuoteDisplayMode,
} from "@/app/pdf/generateQuotePdf";
import { APP_CONFIG } from "@/app/config/pricing";
import { formatCurrency, type PlanQuote } from "@/app/lib/pricing";
import styles from "./DownloadQuote.module.css";

const MODES: readonly {
  value: QuoteDisplayMode;
  title: string;
  description: string;
}[] = [
  {
    value: "net",
    title: "NET only",
    description: "Partner monthly and annual pricing",
  },
  {
    value: "msrp",
    title: "MSRP only",
    description: "Customer-facing monthly and annual pricing",
  },
  {
    value: "both",
    title: "MSRP + NET",
    description: "Show both price levels side by side",
  },
];

interface DownloadQuoteProps {
  quote: PlanQuote;
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
  file,
  mode,
  quote,
}: {
  file: ReadyPdf;
  mode: QuoteDisplayMode;
  quote: PlanQuote;
}) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);
  const pricingRows = [
    {
      description: `${quote.plan.name} base monthly plan`,
      net: quote.plan.monthlyNet,
    },
    ...activeAddons.map((line) => ({
      description: `${line.label} · +${line.addonUnits} (${line.addonCount} add-on${line.addonCount === 1 ? "" : "s"})`,
      net: line.addonNetCost,
    })),
  ];
  const totals: readonly (readonly [string, number])[] =
    mode === "both"
      ? [
          ["Monthly NET", quote.monthlyNet],
          ["Yearly NET", quote.yearlyNet],
          ["Monthly MSRP", quote.monthlyMsrp],
          ["Yearly MSRP", quote.yearlyMsrp],
        ]
      : mode === "net"
        ? [
            ["Monthly NET", quote.monthlyNet],
            ["Yearly NET", quote.yearlyNet],
          ]
        : [
            ["Monthly MSRP", quote.monthlyMsrp],
            ["Yearly MSRP", quote.yearlyMsrp],
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
        <div>
          <dt>Selected plan</dt>
          <dd>{quote.plan.name}</dd>
        </div>
        <div>
          <dt>Generated</dt>
          <dd>{file.generatedOn}</dd>
        </div>
        <div>
          <dt>Pricing view</dt>
          <dd>{pricingViewLabel(mode)}</dd>
        </div>
      </dl>

      <section className={styles.sheetBlock}>
        <h4>Included capacity</h4>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Capacity</th>
                <th>Base</th>
                <th>Add-on capacity</th>
                <th>Total included</th>
                <th>Add-on {pricingViewLabel(mode)}</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr key={line.key}>
                  <th scope="row">{line.label}</th>
                  <td>{line.baseIncluded}</td>
                  <td>
                    {line.addonCount > 0
                      ? `+${line.addonUnits} (${line.addonCount} × ${line.addonStep})`
                      : "—"}
                  </td>
                  <td>{line.totalCapacity}</td>
                  <td>
                    {line.addonCount === 0
                      ? "—"
                      : mode === "both"
                        ? `${formatCurrency(line.addonNetCost)} / ${formatCurrency(line.addonMsrpCost)}`
                        : formatCurrency(
                            mode === "net" ? line.addonNetCost : line.addonMsrpCost,
                          )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.sheetBlock}>
        <h4>Pricing detail</h4>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                {mode !== "msrp" && <th>NET</th>}
                {mode !== "net" && <th>MSRP</th>}
              </tr>
            </thead>
            <tbody>
              {pricingRows.map((row) => (
                <tr key={row.description}>
                  <th scope="row">{row.description}</th>
                  {mode !== "msrp" && <td>{formatCurrency(row.net)}</td>}
                  {mode !== "net" && (
                    <td>{formatCurrency(row.net * APP_CONFIG.msrpMultiplier)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.sheetTotals} aria-label="Quote totals">
        {totals.map(([label, amount], index) => (
          <div className={index === 0 ? styles.primaryTotal : ""} key={label}>
            <span>{label}</span>
            <strong>{formatCurrency(amount)}</strong>
            <small>{APP_CONFIG.currency}</small>
          </div>
        ))}
      </section>

      <p className={styles.sheetDisclaimer}>
        <strong>For reference only</strong> — This quote is not a formal invoice or
        binding offer.
      </p>
      <footer className={styles.sheetFooter}>
        <span>{APP_CONFIG.brandName}</span>
        <span>Letter · 8.5 × 11 in · 1 page</span>
      </footer>
    </article>
  );
}

function downloadButtonLabel(mode: QuoteDisplayMode) {
  if (mode === "net") return "Download NET PDF Quote";
  if (mode === "msrp") return "Download MSRP PDF Quote";
  return "Download NET + MSRP PDF Quote";
}

export function DownloadQuote({
  quote,
  variant = "default",
  fixedMode,
}: DownloadQuoteProps) {
  const [mode, setMode] = useState<QuoteDisplayMode>("both");
  const selectedMode = fixedMode ?? mode;
  const [isGenerating, setIsGenerating] = useState(false);
  const isEmbedded = useSyncExternalStore(
    subscribeToEmbeddingState,
    () => window.self !== window.top,
    () => false,
  );
  const [readyPdf, setReadyPdf] = useState<ReadyPdf | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const quoteKey = `${selectedMode}:${quote.plan.id}:${quote.lines
    .map((line) => line.required)
    .join(",")}`;
  const currentReadyPdf = readyPdf?.quoteKey === quoteKey ? readyPdf : null;

  useEffect(
    () => () => {
      if (readyPdf) URL.revokeObjectURL(readyPdf.url);
    },
    [readyPdf],
  );

  async function handleDownload() {
    const embedded = window.self !== window.top;

    setIsGenerating(true);
    setError("");
    try {
      const file = await createQuotePdfFile(quote, selectedMode);

      if (!embedded) {
        downloadQuotePdfFile(file);
        return;
      }

      setReadyPdf({
        fileName: file.fileName,
        generatedOn: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date()),
        quoteKey,
        url: URL.createObjectURL(file.blob),
      });
      setShowPreview(true);
    } catch {
      setError("The PDF could not be generated. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section
      className={`${styles.section} ${variant === "dock" ? styles.dock : ""} ${variant === "workspace" ? styles.workspace : ""}`}
      aria-labelledby="download-heading"
    >
      <div className={styles.copy}>
        <p className="section-kicker">Step 03</p>
        <h2 id="download-heading">Download Quote</h2>
        <p>
          Export the selected plan, included capacity, add-on detail, and pricing as
          a branded, English, single-page Letter PDF.
        </p>
      </div>

      {!fixedMode && <fieldset className={styles.options}>
        <legend>Choose pricing visibility</legend>
        {MODES.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              checked={selectedMode === option.value}
              name="quote-display-mode"
              onChange={() => {
                setMode(option.value);
                setShowPreview(false);
                setError("");
              }}
              type="radio"
              value={option.value}
            />
            <span className={styles.radioMark} aria-hidden="true" />
            <span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </fieldset>}

      <div className={styles.action}>
        <div>
          <span>Selected quote</span>
          <strong>{quote.plan.name}</strong>
        </div>
        {isEmbedded && currentReadyPdf ? (
          <>
            <a
              className={styles.downloadButton}
              download={currentReadyPdf.fileName}
              href={currentReadyPdf.url}
              onClick={(event) => {
                event.preventDefault();
                setShowPreview(true);
              }}
            >
              Right-click to Open PDF
            </a>
            <button
              className={styles.secondaryButton}
              disabled={isGenerating}
              onClick={handleDownload}
              type="button"
            >
              {isGenerating ? "Rebuilding PDF…" : "Rebuild PDF Quote"}
            </button>
          </>
        ) : (
          <button disabled={isGenerating} onClick={handleDownload} type="button">
            {isGenerating
              ? "Creating PDF…"
              : isEmbedded
                ? "Prepare PDF Quote"
              : downloadButtonLabel(selectedMode)}
          </button>
        )}
        {isEmbedded && !currentReadyPdf && !error && (
          <p className={styles.embedNote}>
            Lark blocks automatic new tabs. Prepare the PDF to preview it inside this
            card.
          </p>
        )}
        {isEmbedded && currentReadyPdf && (
          <p className={styles.pdfReady}>
            PDF ready. Use the preview below, or right-click the green link and choose
            Open Link in New Tab.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
      <p className={styles.disclaimer}>
        For package configuration and pricing reference only. This quote is not a
        formal invoice or binding offer.
      </p>
      {isEmbedded && currentReadyPdf && showPreview && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <div>
              <span>Quote preview</span>
              <strong>{currentReadyPdf.fileName}</strong>
            </div>
            <button onClick={() => setShowPreview(false)} type="button">
              Close preview
            </button>
          </div>
          <QuotePreview file={currentReadyPdf} mode={selectedMode} quote={quote} />
        </div>
      )}
    </section>
  );
}
