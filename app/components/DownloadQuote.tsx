"use client";

import { useState } from "react";
import { generateQuotePdf, type QuoteDisplayMode } from "@/app/pdf/generateQuotePdf";
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

export function DownloadQuote({ quote }: DownloadQuoteProps) {
  const [mode, setMode] = useState<QuoteDisplayMode>("both");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setIsGenerating(true);
    setError("");
    try {
      await generateQuotePdf(quote, mode);
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
          {isGenerating ? "Creating PDF…" : "Download PDF Quote"}
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  );
}
