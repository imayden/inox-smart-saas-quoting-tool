"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
      <div className={styles.topBar} />
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.brandRow}>
            <Image
              alt="INOX Smart"
              className={styles.logo}
              height="37"
              src="/brand/inox-smart-logo.png"
              width="283"
            />
            <span className={styles.version}>Configurator 2.0</span>
          </div>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>{APP_CONFIG.eyebrow}</p>
              <h1>{APP_CONFIG.productName}</h1>
            </div>
            <p className={styles.description}>{APP_CONFIG.description}</p>
          </div>
          <div className={styles.logicStrip}>
            <span>
              <b>Exact pricing logic</b>
              Plan base + whole add-on bundles
            </span>
            <span>
              <b>Automatic matching</b>
              Lowest monthly NET wins
            </span>
            <span>
              <b>PDF ready</b>
              NET, MSRP, or both
            </span>
          </div>
        </header>

        <div className={styles.content}>
          <CapacityInputs
            onChange={handleCapacityChange}
            requirements={requirements}
            selectedPlan={selectedPlan}
          />
          <PlanSelector
            autoMatched={autoMatched}
            onSelect={handlePlanSelect}
            selectedPlanId={selectedPlanId}
          />
          <PricingBreakdown quote={quote} />
          <DownloadQuote quote={quote} />
        </div>

        <footer className={styles.footer}>
          <span>{APP_CONFIG.brandName}</span>
          <span>Pricing configuration and quote generation run locally in your browser.</span>
        </footer>
      </div>
    </main>
  );
}
