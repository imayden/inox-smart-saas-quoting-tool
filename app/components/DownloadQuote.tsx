"use client";

import { useState, useSyncExternalStore } from "react";
import {
  createQuotePdfFile,
  downloadQuotePdfFile,
  type QuoteDisplayMode,
} from "@/app/pdf/generateQuotePdf";
import type { PlanQuote } from "@/app/lib/pricing";
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
}

function subscribeToEmbeddingState() {
  return () => undefined;
}

export function DownloadQuote({ quote }: DownloadQuoteProps) {
  const [mode, setMode] = useState<QuoteDisplayMode>("both");
  const [isGenerating, setIsGenerating] = useState(false);
  const isEmbedded = useSyncExternalStore(
    subscribeToEmbeddingState,
    () => window.self !== window.top,
    () => false,
  );
  const [pdfLink, setPdfLink] = useState("");
  const [error, setError] = useState("");

  async function handleDownload() {
    const embedded = window.self !== window.top;
    let pdfWindow: Window | null = null;

    if (embedded) {
      try {
        pdfWindow = window.open("", "_blank");
      } catch {
        pdfWindow = null;
      }
    }

    if (pdfWindow) {
      try {
        pdfWindow.document.title = "Preparing INOX Smart Quote";
        pdfWindow.document.body.textContent = "Preparing your PDF quote…";
      } catch {
        // Some embedded browsers return a window handle without document access.
      }
    }

    setIsGenerating(true);
    setError("");
    try {
      const file = await createQuotePdfFile(quote, mode);

      if (!embedded) {
        downloadQuotePdfFile(file);
        return;
      }

      if (pdfLink) URL.revokeObjectURL(pdfLink);
      const nextPdfLink = URL.createObjectURL(file.blob);
      setPdfLink(nextPdfLink);

      if (pdfWindow) {
        try {
          pdfWindow.location.replace(nextPdfLink);
        } catch {
          setError(
            "Lark blocked the new PDF tab. Use the generated PDF link below instead.",
          );
        }
      } else {
        setError(
          "Lark blocked the new PDF tab. Use the generated PDF link below instead.",
        );
      }
    } catch {
      pdfWindow?.close();
      setError("The PDF could not be generated. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="download-heading">
      <div className={styles.copy}>
        <p className="section-kicker">Step 03</p>
        <h2 id="download-heading">Download Quote</h2>
        <p>
          Export the selected plan, included capacity, add-on detail, and pricing as
          a branded, English, single-page Letter PDF.
        </p>
      </div>

      <fieldset className={styles.options}>
        <legend>Choose pricing visibility</legend>
        {MODES.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              checked={mode === option.value}
              name="quote-display-mode"
              onChange={() => setMode(option.value)}
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
      </fieldset>

      <div className={styles.action}>
        <div>
          <span>Selected quote</span>
          <strong>{quote.plan.name}</strong>
        </div>
        <button disabled={isGenerating} onClick={handleDownload} type="button">
          {isGenerating
            ? "Creating PDF…"
            : isEmbedded
              ? "Open PDF Quote"
              : "Download PDF Quote"}
        </button>
        {isEmbedded && !pdfLink && !error && (
          <p className={styles.embedNote}>
            In Lark, the PDF opens in a separate browser tab where you can save it.
          </p>
        )}
        {pdfLink && (
          <p className={styles.pdfReady}>
            PDF ready. If no new tab appeared, {" "}
            <a href={pdfLink} rel="noopener noreferrer" target="_blank">
              open the generated PDF
            </a>
            .
          </p>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  );
}
