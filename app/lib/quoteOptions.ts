export interface QuoteAdjustments {
  discountPercent?: number;
  complimentaryMonths?: number;
  termYears?: number;
}

export interface QuoteDetails {
  billToCompany: string;
  billToEmail: string;
  billToName: string;
  memo: string;
  planStartDate: string;
  quotedBy: string;
}

export interface ContractPricing {
  complimentaryCredit: number;
  complimentaryMonths: number;
  discountPercent: number;
  percentageDiscount: number;
  termMonths: number;
  termTotal: number;
  termYears: number;
  totalDue: number;
}

const MONTHS_PER_YEAR = 12;

function toCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function normalizeWholeNumber(value: string, minimum = 0): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(minimum, parsed);
}

export function normalizeDiscountPercent(value: string): number | undefined {
  const parsed = normalizeWholeNumber(value);
  return parsed === undefined ? undefined : Math.min(100, parsed);
}

export function effectiveTermYears(adjustments: QuoteAdjustments): number {
  return Math.max(1, adjustments.termYears ?? 1);
}

export function hasQuoteAdjustments(adjustments: QuoteAdjustments): boolean {
  return Boolean(
    (adjustments.discountPercent ?? 0) > 0 ||
      (adjustments.complimentaryMonths ?? 0) > 0 ||
      effectiveTermYears(adjustments) > 1,
  );
}

/**
 * Applies an optional term discount first, then credits complimentary months at the
 * discounted monthly rate. The existing plan and add-on calculations stay unchanged.
 */
export function calculateContractPricing(
  monthlyPrice: number,
  adjustments: QuoteAdjustments,
): ContractPricing {
  const termYears = effectiveTermYears(adjustments);
  const termMonths = termYears * MONTHS_PER_YEAR;
  const discountPercent = Math.min(100, Math.max(0, adjustments.discountPercent ?? 0));
  const requestedComplimentaryMonths = Math.max(0, adjustments.complimentaryMonths ?? 0);
  const complimentaryMonths = Math.min(termMonths, requestedComplimentaryMonths);
  const termTotal = toCurrency(monthlyPrice * termMonths);
  const percentageDiscount = toCurrency(termTotal * (discountPercent / 100));
  const discountedMonthlyPrice = monthlyPrice * (1 - discountPercent / 100);
  const complimentaryCredit = toCurrency(discountedMonthlyPrice * complimentaryMonths);
  const totalDue = toCurrency(
    Math.max(0, termTotal - percentageDiscount - complimentaryCredit),
  );

  return {
    complimentaryCredit,
    complimentaryMonths,
    discountPercent,
    percentageDiscount,
    termMonths,
    termTotal,
    termYears,
    totalDue,
  };
}

export function createEmptyQuoteDetails(): QuoteDetails {
  return {
    billToCompany: "",
    billToEmail: "",
    billToName: "",
    memo: "",
    planStartDate: "",
    quotedBy: "",
  };
}

export function hasBillToOrPlanDetails(details: QuoteDetails): boolean {
  return Boolean(
    details.billToCompany ||
      details.billToEmail ||
      details.billToName ||
      details.planStartDate ||
      details.quotedBy,
  );
}

export function hasQuoteDetails(details: QuoteDetails): boolean {
  return Object.values(details).some(Boolean);
}
