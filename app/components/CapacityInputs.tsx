import { CAPACITIES, type PricingPlan } from "@/app/config/pricing";
import type { CapacityRequirements } from "@/app/lib/pricing";
import styles from "./CapacityInputs.module.css";

interface CapacityInputsProps {
  requirements: CapacityRequirements;
  selectedPlan: PricingPlan;
  onChange: (key: keyof CapacityRequirements, value: string) => void;
  variant?: "default" | "sidebar";
}

export function CapacityInputs({
  requirements,
  selectedPlan,
  onChange,
  variant = "default",
}: CapacityInputsProps) {
  return (
    <section
      className={`${styles.section} ${variant === "sidebar" ? styles.sidebar : ""}`}
      aria-labelledby="capacity-heading"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className="section-kicker">Step 01</p>
          <h2 id="capacity-heading">Capacity needed</h2>
        </div>
        <p>Whole numbers only. Blank fields are calculated as zero.</p>
      </div>

      <div className={styles.grid}>
        {CAPACITIES.map((capacity) => (
          <label className={styles.field} key={capacity.key}>
            <span className={styles.labelRow}>
              <span>{capacity.label}</span>
              <span className={styles.includedBadge}>
                Plan includes {selectedPlan.included[capacity.key]}
              </span>
            </span>
            <input
              aria-label={`${capacity.label} required`}
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={requirements[capacity.key]}
              onChange={(event) => onChange(capacity.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
