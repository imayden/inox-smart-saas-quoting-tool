import {
  APP_CONFIG,
  CAPACITIES,
  CAPACITY_KEYS,
  PRICING_PLANS,
  type CapacityKey,
  type PricingPlan,
} from "@/app/config/pricing";

export type CapacityInputValue = number | "";
export type CapacityRequirements = Record<CapacityKey, CapacityInputValue>;

export interface QuoteLine {
  key: CapacityKey;
  label: string;
  required: number;
  baseIncluded: number;
  addonStep: number;
  addonCount: number;
  addonUnits: number;
  totalCapacity: number;
  addonNetCost: number;
  addonMsrpCost: number;
}

export interface PlanQuote {
  plan: PricingPlan;
  lines: QuoteLine[];
  monthlyNet: number;
  yearlyNet: number;
  monthlyMsrp: number;
  yearlyMsrp: number;
}

export function createEmptyRequirements(): CapacityRequirements {
  return Object.fromEntries(CAPACITY_KEYS.map((key) => [key, ""])) as CapacityRequirements;
}

/** Preserves the original input behavior: blank stays blank, decimals truncate, negatives clamp to zero. */
export function normalizeCapacityInput(value: string): CapacityInputValue {
  if (value === "") return "";
  return Math.max(0, Number.parseInt(value, 10) || 0);
}

export function getAddonCount(
  required: CapacityInputValue,
  included: number,
  addonStep: number,
): number {
  const numericRequired = required === "" ? 0 : required;
  return numericRequired <= included
    ? 0
    : Math.ceil((numericRequired - included) / addonStep);
}

export function calculatePlanQuote(
  requirements: CapacityRequirements,
  plan: PricingPlan,
): PlanQuote {
  let addonNetTotal = 0;

  const lines = CAPACITIES.map(({ key, label }) => {
    const required = requirements[key] === "" ? 0 : requirements[key];
    const addonCount = getAddonCount(
      requirements[key],
      plan.included[key],
      plan.addonStep[key],
    );
    const addonUnits = addonCount * plan.addonStep[key];
    const addonNetCost = addonCount * APP_CONFIG.addonNetPrice;
    addonNetTotal += addonNetCost;

    return {
      key,
      label,
      required,
      baseIncluded: plan.included[key],
      addonStep: plan.addonStep[key],
      addonCount,
      addonUnits,
      totalCapacity: plan.included[key] + addonUnits,
      addonNetCost,
      addonMsrpCost: addonNetCost * APP_CONFIG.msrpMultiplier,
    };
  });

  const monthlyNet = plan.monthlyNet + addonNetTotal;
  const monthlyMsrp = monthlyNet * APP_CONFIG.msrpMultiplier;

  return {
    plan,
    lines,
    monthlyNet,
    yearlyNet: monthlyNet * APP_CONFIG.monthsPerYear,
    monthlyMsrp,
    yearlyMsrp: monthlyMsrp * APP_CONFIG.monthsPerYear,
  };
}

/** Uses strict less-than so ties keep the first plan, matching the original app. */
export function selectBestPlan(requirements: CapacityRequirements): PricingPlan {
  let selectedPlan = PRICING_PLANS[0];
  let lowestMonthlyNet = Number.POSITIVE_INFINITY;

  for (const plan of PRICING_PLANS) {
    const quote = calculatePlanQuote(requirements, plan);
    if (quote.monthlyNet < lowestMonthlyNet) {
      lowestMonthlyNet = quote.monthlyNet;
      selectedPlan = plan;
    }
  }

  return selectedPlan;
}

export function findPlan(planId: string): PricingPlan {
  return PRICING_PLANS.find((plan) => plan.id === planId) ?? PRICING_PLANS[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: APP_CONFIG.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
