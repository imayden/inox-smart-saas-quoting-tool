import { CAPACITIES, type PricingPlan } from "@/app/config/pricing";
import type { CapacityRequirements } from "@/app/lib/pricing";
import styles from "./CapacityInputs.module.css";

interface CapacityInputsProps {
  additionalCapacityOnly?: boolean;
  requirements: CapacityRequirements;
  selectedPlan: PricingPlan;
  onChange: (key: keyof CapacityRequirements, value: string) => void;
  onClear: () => void;
  variant?: "default" | "workspace";
}

export function CapacityInputs({
  additionalCapacityOnly = false,
  requirements,
  selectedPlan,
  onChange,
  onClear,
  variant = "default",
}: CapacityInputsProps) {
  const hasEnteredCapacity = CAPACITIES.some(
    (capacity) => requirements[capacity.key] !== "",
  );

  return (
    <section
      className={`${styles.section} ${variant === "workspace" ? styles.workspace : ""}`}
      aria-labelledby="capacity-heading"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className="section-kicker">Step 01</p>
          <h2 id="capacity-heading">{additionalCapacityOnly ? "Additional capacity required" : "Capacity needed"}</h2>
        </div>
        <div className={styles.headerActions}>
          <p>{additionalCapacityOnly ? "Enter only the capacity to add. All values are billed as add-ons in whole bundles." : "Whole numbers only. Blank fields are calculated as zero."}</p>
          <button
            className={styles.clearButton}
            disabled={!hasEnteredCapacity}
            onClick={onClear}
            type="button"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {CAPACITIES.map((capacity) => (
          <label className={styles.field} key={capacity.key}>
            <span className={styles.labelRow}>
              <span>{capacity.label}</span>
              <span className={styles.includedBadge}>
                {additionalCapacityOnly ? `Add-on bundle ${selectedPlan.addonStep[capacity.key]}` : `Plan includes ${selectedPlan.included[capacity.key]}`}
              </span>
            </span>
            <input
              aria-label={`${capacity.label} ${additionalCapacityOnly ? "additional capacity" : "required"}`}
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
