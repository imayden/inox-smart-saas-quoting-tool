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
  type PricingMethod,
} from "@/app/lib/pricing";
import {
  createEmptyQuoteDetails,
  type QuoteAdjustments,
  type QuoteDetails,
} from "@/app/lib/quoteOptions";
import { CapacityInputs } from "./CapacityInputs";
import { DownloadQuote } from "./DownloadQuote";
import { PlanSelector } from "./PlanSelector";
import { PricingBreakdown } from "./PricingBreakdown";
import styles from "./PricingConfigurator.module.css";
import type { QuoteDisplayMode } from "@/app/pdf/generateQuotePdf";
import { WorkspaceNav } from "./WorkspaceNav";

interface PricingConfiguratorProps {
  pricingMode: QuoteDisplayMode;
}

export function PricingConfigurator({ pricingMode }: PricingConfiguratorProps) {
  const [requirements, setRequirements] = useState<CapacityRequirements>(
    createEmptyRequirements,
  );
  const [selectedPlanId, setSelectedPlanId] = useState(PRICING_PLANS[0].id);
  const [autoMatched, setAutoMatched] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>("standard");
  const [adjustments, setAdjustments] = useState<QuoteAdjustments>({});
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>(createEmptyQuoteDetails);

  const selectedPlan = findPlan(selectedPlanId);
  const quote = useMemo(
    () => calculatePlanQuote(requirements, selectedPlan, pricingMethod),
    [requirements, pricingMethod, selectedPlan],
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

  function handleClearCapacities() {
    const emptyRequirements = createEmptyRequirements();
    const bestPlan = selectBestPlan(emptyRequirements);

    setRequirements(emptyRequirements);
    setSelectedPlanId(bestPlan.id);
    setAutoMatched(bestPlan.id !== selectedPlanId);
  }

  function handlePlanSelect(planId: string) {
    setSelectedPlanId(planId);
    setAutoMatched(false);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a aria-label="INOX Smart SaaS quoting tool" className={styles.brand} href="#configure">
          <img
            alt="INOX Smart"
            className={styles.logo}
            height="37"
            loading="eager"
            src="/brand/inox-smart-logo-dark.png"
            width="279"
          />
          <span>SaaS Quoting Workspace</span>
        </a>
        <WorkspaceNav />
        <div className={styles.topbarMeta}>
          <span className={styles.saveState}>Pricing Version: 20260629</span>
          <span className={styles.version}>v3.6 by Ayden</span>
        </div>
      </header>

      <div className={styles.contentFrame}>
        <section className={styles.intro} aria-label="Quoting tool overview">
          <div>
            <p className="section-kicker">{APP_CONFIG.eyebrow}</p>
            <h1>SaaS Quoting Workspace - INOX Smart</h1>
          </div>
          <p>
            Configure customer capacity, compare plans side by side, and download the
            selected quote.
          </p>
        </section>

        <div className={styles.workspace} id="configure">
          <aside className={styles.configureColumn} aria-label="Capacity configuration">
            <div className={styles.stickyPanel}>
              <CapacityInputs
                onChange={handleCapacityChange}
                onClear={handleClearCapacities}
                requirements={requirements}
                additionalCapacityOnly={pricingMethod === "additional-capacity-only"}
                selectedPlan={selectedPlan}
                variant="workspace"
              />
              <p className={styles.configureHint}>
                The lowest-cost matching plan is selected automatically. You can select
                another plan at any time.
              </p>
            </div>
          </aside>

          <section className={styles.plansColumn} aria-label="Plan comparison">
            <header className={styles.sectionHeader}>
              <div>
                <p className="section-kicker">Step 02</p>
                <h2>Compare plans</h2>
              </div>
              <p>Choose a plan by clicking its card. All capacity, add-on, and feature details are visible for comparison.</p>
            </header>
            <section className={styles.pricingMethod} aria-labelledby="pricing-method-heading">
              <div>
                <p className="section-kicker">Optional</p>
                <h3 id="pricing-method-heading">Selected plan calculation</h3>
                <p>Currently using {selectedPlan.name}. Keep the standard quote for a plan and its overage capacity, or quote add-on capacity only for an existing subscriber.</p>
              </div>
              <label className={styles.methodToggle}>
                <input
                  checked={pricingMethod === "additional-capacity-only"}
                  onChange={(event) => setPricingMethod(event.target.checked ? "additional-capacity-only" : "standard")}
                  type="checkbox"
                />
                <span className={styles.toggleTrack} aria-hidden="true"><span /></span>
                <span>
                  <strong>Quote additional capacity only</strong>
                  <small>Excludes the plan base fee and included capacity. Step 01 is priced entirely as add-ons using the selected plan.</small>
                </span>
              </label>
            </section>
            <PlanSelector
              autoMatched={autoMatched}
              catalog
              onSelect={handlePlanSelect}
              pricingMode={pricingMode}
              selectedPlanId={selectedPlanId}
            />
          </section>

          <aside className={styles.quoteColumn} aria-label="Current quote">
            <div className={styles.stickyPanel}>
              <PricingBreakdown
                adjustments={adjustments}
                mode={pricingMode}
                onAdjustmentsChange={setAdjustments}
                quote={quote}
                variant="workspace"
              />
              <DownloadQuote
                adjustments={adjustments}
                fixedMode={pricingMode}
                onQuoteDetailsChange={setQuoteDetails}
                quote={quote}
                quoteDetails={quoteDetails}
                variant="workspace"
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
