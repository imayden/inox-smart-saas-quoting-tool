"use client";

/* eslint-disable @next/next/no-img-element -- local brand asset must remain a direct static URL on Netlify */

import { useMemo, useState } from "react";
import { APP_CONFIG, PRICING_PLANS, type CapacityKey } from "@/app/config/pricing";
import {
  calculatePlanQuote,
  createEmptyRequirements,
  findPlan,
  normalizeCapacityInput,
  selectBestPlan,
  type CapacityRequirements,
} from "@/app/lib/pricing";
import { CapacityInputs } from "./CapacityInputs";
import { DownloadQuote } from "./DownloadQuote";
import { PlanSelector } from "./PlanSelector";
import { PricingBreakdown } from "./PricingBreakdown";
import styles from "./PricingConfigurator.module.css";

export function PricingConfigurator() {
  const [requirements, setRequirements] = useState<CapacityRequirements>(
    createEmptyRequirements,
  );
  const [selectedPlanId, setSelectedPlanId] = useState(PRICING_PLANS[0].id);
  const [autoMatched, setAutoMatched] = useState(false);

  const selectedPlan = findPlan(selectedPlanId);
  const quote = useMemo(
    () => calculatePlanQuote(requirements, selectedPlan),
    [requirements, selectedPlan],
  );

  function handleCapacityChange(key: CapacityKey, rawValue: string) {
    const nextRequirements = {
      ...requirements,
      [key]: normalizeCapacityInput(rawValue),
    };
    const bestPlan = selectBestPlan(nextRequirements);

    setRequirements(nextRequirements);
    if (bestPlan.id !== selectedPlanId) {
      setSelectedPlanId(bestPlan.id);
      setAutoMatched(true);
    } else {
      setAutoMatched(false);
    }
  }

  function handlePlanSelect(planId: string) {
    setSelectedPlanId(planId);
    setAutoMatched(false);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandRow}>
            <img
              alt="INOX Smart"
              className={styles.logo}
              height="37"
              loading="eager"
              src="/brand/inox-smart-logo-light.png"
              width="279"
            />
            <span className={styles.version}>3.0 preview</span>
          </div>
          <div className={styles.sidebarTitle}>
            <p className={styles.eyebrow}>{APP_CONFIG.eyebrow}</p>
            <h1>Configure capacity.</h1>
          </div>
          <div className={styles.sidebarContent}>
            <CapacityInputs
              onChange={handleCapacityChange}
              requirements={requirements}
              selectedPlan={selectedPlan}
              variant="sidebar"
            />
          </div>
        </aside>

        <section className={styles.plansPane}>
          <header className={styles.workspaceHeader}>
            <div>
              <p className="section-kicker">Step 02</p>
              <h2>Select plans</h2>
            </div>
          </header>
          <PlanSelector
            autoMatched={autoMatched}
            catalog
            onSelect={handlePlanSelect}
            selectedPlanId={selectedPlanId}
          />
        </section>

        <section className={styles.quoteDock} aria-label="Live quote controls">
          <PricingBreakdown quote={quote} variant="dock" />
          <DownloadQuote quote={quote} variant="dock" />
        </section>
      </div>
    </main>
  );
}
