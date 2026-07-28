import {
  APP_CONFIG,
  CAPACITIES,
  PLAN_FEATURES,
  PRICING_PLANS,
} from "@/app/config/pricing";
import { formatCurrency } from "@/app/lib/pricing";
import styles from "./PlanSelector.module.css";

interface PlanSelectorProps {
  selectedPlanId: string;
  autoMatched: boolean;
  onSelect: (planId: string) => void;
  catalog?: boolean;
}

export function PlanSelector({
  selectedPlanId,
  autoMatched,
  onSelect,
  catalog = false,
}: PlanSelectorProps) {
  return (
    <section className={styles.section} aria-label="Available SaaS plans">
      {!catalog && (
        <div className={styles.headerRow}>
          <div>
            <p className="section-kicker">Step 02</p>
            <h2>Choose a plan</h2>
          </div>
          <span className={styles.optional}>Manual selection available</span>
        </div>
      )}

      {autoMatched && (
        <div className={styles.notice} role="status">
          <span aria-hidden="true">✓</span>
          We updated the selection to the lowest-cost plan that covers your latest
          capacity.
        </div>
      )}

      <ul className={styles.list}>
        {PRICING_PLANS.map((plan) => {
          const selected = selectedPlanId === plan.id;
          const features = PLAN_FEATURES[plan.id] ?? [];
          return (
            <li key={plan.id}>
              <article
                className={`${styles.card} ${selected ? styles.selected : ""}`}
                data-selected={selected || undefined}
              >
                <div className={styles.cardTop}>
                  <div className={styles.planIdentity}>
                    <div className={styles.planTitleRow}>
                      <h3>{plan.name}</h3>
                      {selected && <span className={styles.selectedBadge}>Selected</span>}
                    </div>
                    <p>
                      {selected
                        ? "This plan is used in the live quote."
                        : "Choose this plan to use it in the live quote."}
                    </p>
                  </div>

                  <div className={styles.priceBlock}>
                    <span>Starting at</span>
                    <strong>{formatCurrency(plan.monthlyNet)}</strong>
                    <small>NET / month</small>
                    <p>
                      MSRP {formatCurrency(plan.monthlyNet * APP_CONFIG.msrpMultiplier)} / month
                    </p>
                  </div>

                  <button
                    aria-pressed={selected}
                    className={styles.selectButton}
                    onClick={() => onSelect(plan.id)}
                    type="button"
                  >
                    {selected ? "Selected plan" : `Choose ${plan.name}`}
                  </button>
                </div>

                <div className={styles.capacityGroup}>
                  <p className={styles.groupLabel}>Included capacity</p>
                  <ul className={styles.capacityList}>
                    {CAPACITIES.map((capacity) => (
                      <li key={capacity.key}>
                        <strong>{plan.included[capacity.key]}</strong>
                        <span>{capacity.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <details className={styles.details}>
                  <summary>
                    <span>
                      Plan details
                      <small>{features.length} included features · 5 add-on rules</small>
                    </span>
                    <span className={styles.detailsIcon} aria-hidden="true">⌄</span>
                  </summary>
                  <div className={styles.detailsBody}>
                    <section aria-label={`${plan.name} add-on rules`}>
                      <h4>Add-on increments</h4>
                      <p className={styles.addonIntro}>
                        {formatCurrency(APP_CONFIG.addonNetPrice)} NET per add-on, per month
                      </p>
                      <ul className={styles.addonList}>
                        {CAPACITIES.map((capacity) => (
                          <li key={capacity.key}>
                            +{plan.addonStep[capacity.key]} {capacity.label}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section aria-label={`${plan.name} included features`}>
                      <h4>Included features</h4>
                      <ul className={styles.featureList}>
                        {features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </details>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
