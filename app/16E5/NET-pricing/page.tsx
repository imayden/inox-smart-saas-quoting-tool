import type { Metadata } from "next";
import { PricingConfigurator } from "@/app/components/PricingConfigurator";

// Hexadecimal 16E5 converts to decimal 5861.
export const metadata: Metadata = {
  title: "NET - INOX Smart SaaS Quoting Workspace",
};

export default function NetPricingPage() {
  return <PricingConfigurator pricingMode="net" />;
}
