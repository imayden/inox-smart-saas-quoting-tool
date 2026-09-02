import assert from "node:assert/strict";
import test from "node:test";
import { PRICING_PLANS } from "../app/config/pricing";
import {
  calculatePlanQuote,
  createEmptyRequirements,
  normalizeCapacityInput,
  selectBestPlan,
  type CapacityRequirements,
} from "../app/lib/pricing";
import { calculateContractPricing, normalizeDiscountPercent } from "../app/lib/quoteOptions";

function requirements(
  values: Partial<Record<keyof CapacityRequirements, number>>,
): CapacityRequirements {
  return { ...createEmptyRequirements(), ...values };
}

test("blank requirements preserve the original Elite base price", () => {
  const quote = calculatePlanQuote(createEmptyRequirements(), PRICING_PLANS[0]);
  assert.equal(quote.monthlyNet, 49.99);
  assert.equal(quote.monthlyMsrp, 99.98);
  assert.equal(quote.yearlyNet, 599.88);
  assert.equal(quote.yearlyMsrp, 1199.76);
});

test("Enterprise base price matches the NET/MSRP V20260629 price sheets", () => {
  const quote = calculatePlanQuote(createEmptyRequirements(), PRICING_PLANS[2]);
  assert.equal(quote.monthlyNet, 249.99);
  assert.equal(quote.monthlyMsrp, 499.98);
  assert.equal(quote.yearlyNet, 2999.88);
  assert.equal(quote.yearlyMsrp, 5999.76);
});

test("add-ons round up by whole bundle and cost $5 NET each", () => {
  const quote = calculatePlanQuote(requirements({ devices: 6 }), PRICING_PLANS[0]);
  const devices = quote.lines.find((line) => line.key === "devices");
  assert.equal(devices?.addonCount, 1);
  assert.equal(devices?.addonUnits, 5);
  assert.equal(devices?.totalCapacity, 10);
  assert.equal(devices?.addonNetCost, 5);
  assert.equal(quote.monthlyNet, 54.99);
});

test("additional-capacity-only quotes every requested unit as an add-on without a plan base fee", () => {
  const quote = calculatePlanQuote(
    requirements({ devices: 23 }),
    PRICING_PLANS[1],
    "additional-capacity-only",
  );
  const devices = quote.lines.find((line) => line.key === "devices");
  assert.equal(quote.baseMonthlyNet, 0);
  assert.equal(devices?.baseIncluded, 0);
  assert.equal(devices?.addonCount, 5);
  assert.equal(devices?.addonUnits, 25);
  assert.equal(quote.monthlyNet, 25);
  assert.equal(quote.monthlyMsrp, 50);
});

test("auto-match chooses Professional at its complete base capacity", () => {
  const selected = selectBestPlan(
    requirements({
      devices: 25,
      mobile: 25,
      ekeys: 250,
      properties: 10,
      saasLogins: 10,
    }),
  );
  assert.equal(selected.id, "professional");
});

test("auto-match chooses Enterprise at its complete base capacity", () => {
  const selected = selectBestPlan(
    requirements({
      devices: 100,
      mobile: 100,
      ekeys: 500,
      properties: 20,
      saasLogins: 20,
    }),
  );
  assert.equal(selected.id, "enterprise");
});

test("price ties preserve earlier plan order", () => {
  const selected = selectBestPlan(
    requirements({ devices: 10, ekeys: 400, properties: 10 }),
  );
  const elite = calculatePlanQuote(
    requirements({ devices: 10, ekeys: 400, properties: 10 }),
    PRICING_PLANS[0],
  );
  const professional = calculatePlanQuote(
    requirements({ devices: 10, ekeys: 400, properties: 10 }),
    PRICING_PLANS[1],
  );
  assert.equal(elite.monthlyNet, professional.monthlyNet);
  assert.equal(selected.id, "elite");
});

test("input normalization matches the original integer behavior", () => {
  assert.equal(normalizeCapacityInput(""), "");
  assert.equal(normalizeCapacityInput("7.9"), 7);
  assert.equal(normalizeCapacityInput("-3"), 0);
  assert.equal(normalizeCapacityInput("not-a-number"), 0);
});

test("term pricing applies a percentage discount before complimentary months", () => {
  const pricing = calculateContractPricing(100, {
    termYears: 5,
    discountPercent: 20,
    complimentaryMonths: 2,
  });
  assert.equal(pricing.termMonths, 60);
  assert.equal(pricing.termTotal, 6000);
  assert.equal(pricing.percentageDiscount, 1200);
  assert.equal(pricing.complimentaryCredit, 160);
  assert.equal(pricing.totalDue, 4640);
});

test("term pricing supports discount percentages to two decimal places", () => {
  const pricing = calculateContractPricing(100, {
    discountPercent: normalizeDiscountPercent("28.56"),
    termYears: 1,
  });

  assert.equal(pricing.discountPercent, 28.56);
  assert.equal(pricing.percentageDiscount, 342.72);
  assert.equal(pricing.totalDue, 857.28);
  assert.equal(normalizeDiscountPercent("28.567"), 28.57);
});

test("monthly subscription pricing uses whole months and excludes complimentary months", () => {
  const pricing = calculateContractPricing(100, {
    billingMode: "monthly",
    termMonths: 5,
    discountPercent: 20,
    complimentaryMonths: 2,
  });
  assert.equal(pricing.termMonths, 5);
  assert.equal(pricing.termYears, undefined);
  assert.equal(pricing.termTotal, 500);
  assert.equal(pricing.percentageDiscount, 100);
  assert.equal(pricing.complimentaryCredit, 0);
  assert.equal(pricing.totalDue, 400);
});
