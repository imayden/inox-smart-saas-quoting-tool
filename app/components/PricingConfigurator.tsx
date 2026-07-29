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

interface PricingConfiguratorProps {
  pricingMode: QuoteDisplayMode;
}

export function PricingConfigurator({ pricingMode }: PricingConfiguratorProps) {
  const [requirements, setRequirements] = useState<CapacityRequirements>(
    createEmptyRequirements,
  );
  const [selectedPlanId, setSelectedPlanId] = useState(PRICING_PLANS[0].id);
  const [autoMatched, setAutoMatched] = useState(false);
  const [adjustments, setAdjustments] = useState<QuoteAdjustments>({});
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>(createEmptyQuoteDetails);

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
        <div className={styles.topbarMeta}>
          <span className={styles.saveState}>Pricing Version: 20260629</span>
          <span className={styles.version}>v3.0 by Ayden</span>
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
                requirements={requirements}
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
