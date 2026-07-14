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

test("add-ons round up by whole bundle and cost $5 NET each", () => {
  const quote = calculatePlanQuote(requirements({ devices: 6 }), PRICING_PLANS[0]);
  const devices = quote.lines.find((line) => line.key === "devices");
  assert.equal(devices?.addonCount, 1);
  assert.equal(devices?.addonUnits, 5);
  assert.equal(devices?.totalCapacity, 10);
  assert.equal(devices?.addonNetCost, 5);
  assert.equal(quote.monthlyNet, 54.99);
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
