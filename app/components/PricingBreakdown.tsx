import { APP_CONFIG } from "@/app/config/pricing";
import { formatCurrency, type PlanQuote } from "@/app/lib/pricing";
import styles from "./PricingBreakdown.module.css";

interface PricingBreakdownProps {
  quote: PlanQuote;
  variant?: "default" | "sidebar" | "dock";
}

export function PricingBreakdown({ quote, variant = "default" }: PricingBreakdownProps) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);

  return (
    <section
      className={`${styles.section} ${variant === "sidebar" ? styles.sidebar : ""} ${variant === "dock" ? styles.dock : ""}`}
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
          <b>{formatCurrency(quote.plan.monthlyNet)} NET</b>
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
                  {line.addonCount === 1 ? "" : "s"} × {formatCurrency(APP_CONFIG.addonNetPrice)}
                </small>
              </span>
              <b>{formatCurrency(line.addonNetCost)}</b>
            </div>
          ))
        )}

        <div className={`${styles.line} ${styles.subtotal}`}>
          <span>Monthly NET</span>
          <b>{formatCurrency(quote.monthlyNet)}</b>
        </div>
        <div className={`${styles.line} ${styles.msrpLine}`}>
          <span>Monthly MSRP</span>
          <b>{formatCurrency(quote.monthlyMsrp)}</b>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span>Monthly NET</span>
          <strong>{formatCurrency(quote.monthlyNet)}</strong>
          <small>MSRP {formatCurrency(quote.monthlyMsrp)}</small>
        </div>
        <div className={styles.metric}>
          <span>Yearly NET</span>
          <strong>{formatCurrency(quote.yearlyNet)}</strong>
          <small>MSRP {formatCurrency(quote.yearlyMsrp)}</small>
        </div>
      </div>
    </section>
  );
}
