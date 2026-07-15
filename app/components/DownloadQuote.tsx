"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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

interface ReadyPdf {
  fileName: string;
  quoteKey: string;
  url: string;
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
  const [readyPdf, setReadyPdf] = useState<ReadyPdf | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const quoteKey = `${mode}:${quote.plan.id}:${quote.lines
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
      const file = await createQuotePdfFile(quote, mode);

      if (!embedded) {
        downloadQuotePdfFile(file);
        return;
      }

      setReadyPdf({
        fileName: file.fileName,
        quoteKey,
        url: URL.createObjectURL(file.blob),
      });
      setShowPreview(false);
    } catch {
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
      </fieldset>

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
              onClick={() => setShowPreview(true)}
            >
              Download PDF Quote
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
                : "Download PDF Quote"}
          </button>
        )}
        {isEmbedded && !currentReadyPdf && !error && (
          <p className={styles.embedNote}>
            Lark uses a two-step download: prepare the PDF, then click the download
            link that appears here.
          </p>
        )}
        {isEmbedded && currentReadyPdf && (
          <p className={styles.pdfReady}>
            PDF ready. A normal left click downloads it; the same click also opens a
            preview below if Lark blocks the download.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
      {isEmbedded && currentReadyPdf && showPreview && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <div>
              <span>PDF preview</span>
              <strong>{currentReadyPdf.fileName}</strong>
            </div>
            <button onClick={() => setShowPreview(false)} type="button">
              Close preview
            </button>
          </div>
          <iframe src={currentReadyPdf.url} title="Generated INOX Smart PDF quote" />
        </div>
      )}
    </section>
  );
}
