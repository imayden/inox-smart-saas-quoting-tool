import { APP_CONFIG } from "@/app/config/pricing";
import { formatCurrency, type PlanQuote } from "@/app/lib/pricing";
import {
  calculateContractPricing,
  effectiveBillingMode,
  formatTerm,
  hasQuoteAdjustments,
  normalizeDiscountPercent,
  normalizeWholeNumber,
  type QuoteAdjustments,
} from "@/app/lib/quoteOptions";
import styles from "./PricingBreakdown.module.css";
import type { QuoteDisplayMode } from "@/app/pdf/generateQuotePdf";

interface PricingBreakdownProps {
  adjustments: QuoteAdjustments;
  onAdjustmentsChange: (adjustments: QuoteAdjustments) => void;
  quote: PlanQuote;
  variant?: "default" | "sidebar" | "dock" | "workspace";
  mode?: QuoteDisplayMode;
}

function formatPrice(net: number, mode: QuoteDisplayMode) {
  if (mode === "net") return `${formatCurrency(net)} NET`;
  if (mode === "msrp") return `${formatCurrency(net * APP_CONFIG.msrpMultiplier)} MSRP`;
  return `${formatCurrency(net)} NET / ${formatCurrency(net * APP_CONFIG.msrpMultiplier)} MSRP`;
}

export function PricingBreakdown({
  adjustments,
  onAdjustmentsChange,
  quote,
  variant = "default",
  mode = "both",
}: PricingBreakdownProps) {
  const activeAddons = quote.lines.filter((line) => line.addonCount > 0);
  const showNet = mode !== "msrp";
  const showMsrp = mode !== "net";
  const netContract = calculateContractPricing(quote.monthlyNet, adjustments);
  const msrpContract = calculateContractPricing(quote.monthlyMsrp, adjustments);
  const showContract = hasQuoteAdjustments(adjustments);
  const additionalCapacityOnly = quote.pricingMethod === "additional-capacity-only";
  const billingMode = effectiveBillingMode(adjustments);

  function updateAdjustments(update: Partial<QuoteAdjustments>) {
    onAdjustmentsChange({ ...adjustments, ...update });
  }

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
        {additionalCapacityOnly ? (
          <div className={`${styles.line} ${styles.methodNotice}`}>
            <span>
              <strong>Additional capacity only</strong>
              <small>Existing plan base fee and included capacity are excluded.</small>
            </span>
            <b>{formatPrice(0, mode)}</b>
          </div>
        ) : (
          <div className={styles.line}>
            <span>
              <strong>{quote.plan.name}</strong>
              <small>Base monthly plan</small>
            </span>
            <b>{formatPrice(quote.baseMonthlyNet, mode)}</b>
          </div>
        )}

        {activeAddons.length === 0 ? (
          <p className={styles.noAddons}>{additionalCapacityOnly ? "No additional capacity has been entered." : "All requested capacity is covered by the base plan."}</p>
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

      <details className={styles.quoteOptions}>
        <summary>
          <span>
            Quote options
            <small>Optional · 1-year term by default</small>
          </span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.optionsBody}>
          <fieldset className={styles.billingMode}>
            <legend>Billing method</legend>
            <label>
              <input
                checked={billingMode === "annual"}
                name="billing-mode"
                onChange={() => updateAdjustments({ billingMode: "annual", termMonths: undefined })}
                type="radio"
              />
              <span><strong>Annual commitment</strong><small>Term is entered in whole years.</small></span>
            </label>
            <label>
              <input
                checked={billingMode === "monthly"}
                name="billing-mode"
                onChange={() => updateAdjustments({ billingMode: "monthly", complimentaryMonths: undefined })}
                type="radio"
              />
              <span><strong>Monthly subscription</strong><small>Term is entered in whole months.</small></span>
            </label>
          </fieldset>
          <label>
            <span>{billingMode === "annual" ? "Term length (years)" : "Term length (months)"}</span>
            <input
              aria-label={`Term length in ${billingMode === "annual" ? "years" : "months"}`}
              inputMode="numeric"
              min="1"
              onChange={(event) =>
                updateAdjustments(
                  billingMode === "annual"
                    ? { termYears: normalizeWholeNumber(event.target.value, 1) }
                    : { termMonths: normalizeWholeNumber(event.target.value, 1) },
                )
              }
              placeholder={billingMode === "annual" ? "1" : "e.g. 6"}
              type="number"
              value={billingMode === "annual" ? adjustments.termYears ?? "" : adjustments.termMonths ?? ""}
            />
          </label>
          <label>
            <span>Term discount (%)</span>
            <input
              aria-label="Term discount percentage"
              inputMode="decimal"
              max="100"
              min="0"
              onChange={(event) =>
                updateAdjustments({ discountPercent: normalizeDiscountPercent(event.target.value) })
              }
              placeholder="e.g. 28.56"
              step="0.01"
              type="number"
              value={adjustments.discountPercent ?? ""}
            />
          </label>
          {billingMode === "annual" && <label>
            <span>Complimentary months</span>
            <input
              aria-label="Complimentary months"
              inputMode="numeric"
              min="0"
              onChange={(event) =>
                updateAdjustments({ complimentaryMonths: normalizeWholeNumber(event.target.value) })
              }
              placeholder="e.g. 2"
              type="number"
              value={adjustments.complimentaryMonths ?? ""}
            />
          </label>}
          <p>
            {billingMode === "annual"
              ? "Percentage savings apply to the full term first. Complimentary months are then credited at the discounted monthly rate and cannot exceed the term duration."
              : "The total is calculated from whole subscription months, then the percentage discount is applied to the full term."}
          </p>
        </div>
      </details>

      {showContract && (
        <section className={styles.contractSummary} aria-label="Contract quote summary">
          <div className={styles.contractHeading}>
            <span>Contract quote</span>
            <strong>
              {formatTerm(adjustments)}
            </strong>
          </div>
          {mode === "both" ? (
            <div className={`${styles.contractTable} ${styles.contractTableBoth}`}>
              <span className={styles.contractColumnLabel} />
              <span className={styles.contractColumnLabel}>NET</span>
              <span className={styles.contractColumnLabel}>MSRP</span>
              <span>Term total</span><b>{formatCurrency(netContract.termTotal)}</b><b>{formatCurrency(msrpContract.termTotal)}</b>
              {netContract.percentageDiscount > 0 && <><span>{netContract.discountPercent}% term discount</span><b>−{formatCurrency(netContract.percentageDiscount)}</b><b>−{formatCurrency(msrpContract.percentageDiscount)}</b></>}
              {netContract.complimentaryCredit > 0 && <><span>{netContract.complimentaryMonths} complimentary month{netContract.complimentaryMonths === 1 ? "" : "s"}</span><b>−{formatCurrency(netContract.complimentaryCredit)}</b><b>−{formatCurrency(msrpContract.complimentaryCredit)}</b></>}
              <span>Total due</span><b>{formatCurrency(netContract.totalDue)} NET</b><b>{formatCurrency(msrpContract.totalDue)} MSRP</b>
            </div>
          ) : (
            <div className={styles.contractTable}>
              <span>Term total</span><b>{formatCurrency((showNet ? netContract : msrpContract).termTotal)}</b>
              {(showNet ? netContract : msrpContract).percentageDiscount > 0 && <><span>{(showNet ? netContract : msrpContract).discountPercent}% term discount</span><b>−{formatCurrency((showNet ? netContract : msrpContract).percentageDiscount)}</b></>}
              {(showNet ? netContract : msrpContract).complimentaryCredit > 0 && <><span>{(showNet ? netContract : msrpContract).complimentaryMonths} complimentary month{(showNet ? netContract : msrpContract).complimentaryMonths === 1 ? "" : "s"}</span><b>−{formatCurrency((showNet ? netContract : msrpContract).complimentaryCredit)}</b></>}
              <span>Total due</span><b>{formatCurrency((showNet ? netContract : msrpContract).totalDue)} {showNet ? "NET" : "MSRP"}</b>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
