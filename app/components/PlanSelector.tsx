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
    <section className={styles.section} aria-labelledby="plan-heading">
      {!catalog && (
        <div className={styles.headerRow}>
          <div>
            <p className="section-kicker">Step 02</p>
            <h2 id="plan-heading">Choose a plan</h2>
          </div>
          <span className={styles.optional}>Optional override</span>
        </div>
      )}

      {autoMatched && (
        <div className={styles.notice} role="status">
          Best-value plan automatically selected from your latest capacity input.
        </div>
      )}

      <div className={styles.grid}>
        {PRICING_PLANS.map((plan) => {
          const selected = selectedPlanId === plan.id;
          return (
            <button
              aria-pressed={selected}
              className={`${styles.card} ${selected ? styles.selected : ""}`}
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              type="button"
            >
              <span className={styles.selectionMark} aria-hidden="true">
                {selected ? "Selected" : "Select"}
              </span>
              <strong className={styles.planName}>{plan.name}</strong>
              <span className={styles.price}>
                {formatCurrency(plan.monthlyNet)}
                <small> / month NET</small>
              </span>
              <span className={styles.msrp}>
                MSRP {formatCurrency(plan.monthlyNet * APP_CONFIG.msrpMultiplier)} / month
              </span>
              <span className={styles.rule} />
              <span className={styles.catalogLabel}>Plan starts with</span>
              <span className={styles.capacityList}>
                {CAPACITIES.map((capacity) => (
                  <span key={capacity.key}>
                    <b>{plan.included[capacity.key]}</b> {capacity.label}
                  </span>
                ))}
              </span>
              <span className={styles.rule} />
              <span className={styles.catalogLabel}>Add-ons</span>
              <span className={styles.addonList}>
                {CAPACITIES.map((capacity) => (
                  <span key={capacity.key}>
                    {formatCurrency(APP_CONFIG.addonNetPrice)} per {plan.addonStep[capacity.key]} {capacity.label}
                  </span>
                ))}
              </span>
              <span className={styles.rule} />
              <span className={styles.featureHeading}>Included features</span>
              <span className={styles.featureList}>
                {(PLAN_FEATURES[plan.id] ?? []).map((feature) => (
                  <span key={feature}>{feature}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
