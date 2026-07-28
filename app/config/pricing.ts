/**
 * Business-editable pricing configuration.
 *
 * Change plan names, prices, included capacity, add-on bundle sizes, labels,
 * and brand copy here. The calculation engine and UI read from this file.
 */

export const CAPACITY_KEYS = [
  "devices",
  "mobile",
  "ekeys",
  "properties",
  "saasLogins",
] as const;

export type CapacityKey = (typeof CAPACITY_KEYS)[number];

export type CapacityValues = Record<CapacityKey, number>;

export interface CapacityDefinition {
  key: CapacityKey;
  label: string;
  pdfLabel: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyNet: number;
  included: CapacityValues;
  addonStep: CapacityValues;
}

/** Plan feature copy shown in the v3 plan catalog. */
export const PLAN_FEATURES: Readonly<Record<string, readonly string[]>> = {
  elite: [
    "Batch Enrollment / Move-In",
    "Batch Setup Import",
    "User Access Scheduling",
    "Passage & Privacy Modes",
    "Passage & Privacy Mode Scheduling",
    "Door Propped Open Alert",
    "Customizable User Permissions",
    "Advanced Filters",
    "Unlimited Data Export",
    "100,000 Audit Trail per device",
    "Activity Notifications",
    "Elite Dashboard",
    "Free Smart Mobile App",
  ],
  professional: [
    "Everything in Elite Plan PLUS:",
    "Lock Down",
    "Lost / Stolen Cards",
    "Same-Day Multi-Schedule Passage & Privacy Mode",
    "API Integration Capabilities (additional costs may apply)",
    "Professional Dashboard",
  ],
  enterprise: [
    "Everything in Pro Plan PLUS:",
    "Custom Branding",
    "Move-In / Move-Out Calendar",
    "Enterprise Dashboard",
    "And more coming soon...",
  ],
};

export const APP_CONFIG = {
  brandName: "INOX Smart",
  productName: "SaaS Quoting Tool",
  eyebrow: "INTERNAL USE ONLY",
  versionLabel: "v2.0 by Ayden",
  description:
    "Enter the capacity your customer needs. The configurator automatically selects the lowest-priced plan while allowing a manual plan override.",
  quoteTitle: "INOX Smart SaaS Quote",
  quoteSubtitle: "Cloud access and credential management",
  currency: "USD",
  currencySymbol: "$",
  themeColor: "#80C41C",
  addonNetPrice: 5,
  msrpMultiplier: 2,
  monthsPerYear: 12,
  quoteFilePrefix: "inox-smart-saas-quote",
} as const;

export const CAPACITIES: readonly CapacityDefinition[] = [
  { key: "devices", label: "Devices", pdfLabel: "Devices" },
  {
    key: "mobile",
    label: "Mobile Accounts",
    pdfLabel: "Mobile Accounts",
  },
  { key: "ekeys", label: "E-Keys", pdfLabel: "E-Keys" },
  { key: "properties", label: "Properties", pdfLabel: "Properties" },
  {
    key: "saasLogins",
    label: "SaaS Logins",
    pdfLabel: "SaaS Logins",
  },
];

/**
 * Plan order is significant. When two plans have the same calculated price,
 * the first plan wins, matching the original configurator exactly.
 */
export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "elite",
    name: "Elite",
    monthlyNet: 49.99,
    included: {
      devices: 5,
      mobile: 5,
      ekeys: 50,
      properties: 5,
      saasLogins: 5,
    },
    addonStep: {
      devices: 5,
      mobile: 5,
      ekeys: 25,
      properties: 5,
      saasLogins: 5,
    },
  },
  {
    id: "professional",
    name: "Professional",
    monthlyNet: 99.99,
    included: {
      devices: 25,
      mobile: 25,
      ekeys: 250,
      properties: 10,
      saasLogins: 10,
    },
    addonStep: {
      devices: 5,
      mobile: 5,
      ekeys: 25,
      properties: 5,
      saasLogins: 5,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    // NET V20260629: $249.99/month; corresponding MSRP is $499.98/month.
    monthlyNet: 249.99,
    included: {
      devices: 100,
      mobile: 100,
      ekeys: 500,
      properties: 20,
      saasLogins: 20,
    },
    addonStep: {
      devices: 10,
      mobile: 10,
      ekeys: 50,
      properties: 10,
      saasLogins: 10,
    },
  },
];
