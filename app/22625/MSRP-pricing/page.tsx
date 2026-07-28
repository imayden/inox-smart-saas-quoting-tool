import type { Metadata } from "next";
import { PricingConfigurator } from "@/app/components/PricingConfigurator";

// Hexadecimal 5861 converts to decimal 22625.
export const metadata: Metadata = {
  title: "MSRP - INOX Smart SaaS Quoting Workspace",
};

export default function MsrpPricingPage() {
  return <PricingConfigurator pricingMode="msrp" />;
}
