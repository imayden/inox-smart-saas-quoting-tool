import { APP_CONFIG } from "@/app/config/pricing";
import { formatCurrency, type PlanQuote } from "@/app/lib/pricing";
import styles from "./PricingBreakdown.module.css";
import type { QuoteDisplayMode } from "@/app/pdf/generateQuotePdf";

interface PricingBreakdownProps {
  quote: PlanQuote;
  variant?: "default" | "sidebar" | "dock" | "workspace";
  mode?: QuoteDisplayMode;
}

function formatPrice(net: number, mode: QuoteDisplayMode) {
  if (mode === "net") return `${formatCurrency(net)} NET`;
  if (mode === "msrp") {
    return `${formatCurrency(net * APP_CONFIG.msrpMultiplier)} MSRP`;
  }
  return `${formatCurrency(net)} NET / ${formatCurrency(net * APP_CONFIG.msrpMultiplier)} MSRP`;
}

export function PricingBreakdown({
  quote,
  variant = "default",
  mode = "both",
}: PricingBreakdownProps) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);
  const showNet = mode !== "msrp";
  const showMsrp = mode !== "net";

  return (
    <section
      className={`${styles.section} ${variant === "sidebar" ? styles.sidebar : ""} ${variant === "dock" ? styles.dock : ""} ${variant === "workspace" ? styles.workspace : ""}`}
      aria-labelledby="pricing-heading"
    >
      <div className={styles.header}>
        <div>
          <p className="section-kicker">Live quote</p>
          <h2 id="pricing-heading">Pricing details</h2>
        </div>
        <span className={styles.planPill}>{quote.plan.name}</span>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.line}>
          <span>
            <strong>{quote.plan.name}</strong>
            <small>Base monthly plan</small>
          </span>
          <b>{formatPrice(quote.plan.monthlyNet, mode)}</b>
        </div>

        {activeAddons.length === 0 ? (
          <p className={styles.noAddons}>All requested capacity is covered by the base plan.</p>
        ) : (
          activeAddons.map((line) => (
            <div className={`${styles.line} ${styles.addonLine}`} key={line.key}>
              <span>
                <strong>{line.label}</strong>
                <small>
                  +{line.addonUnits} capacity · {line.addonCount} add-on
                  {line.addonCount === 1 ? "" : "s"} × {formatPrice(APP_CONFIG.addonNetPrice, mode)}
                </small>
              </span>
              <b>{formatPrice(line.addonNetCost, mode)}</b>
            </div>
          ))
        )}

        {showNet && (
          <div className={`${styles.line} ${styles.subtotal}`}>
            <span>Monthly NET</span>
            <b>{formatCurrency(quote.monthlyNet)}</b>
          </div>
        )}
        {showMsrp && (
          <div className={`${styles.line} ${showNet ? styles.msrpLine : styles.subtotal}`}>
            <span>Monthly MSRP</span>
            <b>{formatCurrency(quote.monthlyMsrp)}</b>
          </div>
        )}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span>{showNet ? "Monthly NET" : "Monthly MSRP"}</span>
          <strong>{formatCurrency(showNet ? quote.monthlyNet : quote.monthlyMsrp)}</strong>
          {mode === "both" && <small>MSRP {formatCurrency(quote.monthlyMsrp)}</small>}
        </div>
        <div className={styles.metric}>
          <span>{showNet ? "Yearly NET" : "Yearly MSRP"}</span>
          <strong>{formatCurrency(showNet ? quote.yearlyNet : quote.yearlyMsrp)}</strong>
          {mode === "both" && <small>MSRP {formatCurrency(quote.yearlyMsrp)}</small>}
        </div>
      </div>
    </section>
  );
}
