import type { Metadata } from "next";
import { PricingConfigurator } from "@/app/components/PricingConfigurator";

// 16E522625 combines the 16E5 and 22625 route keys.
export const metadata: Metadata = {
  title: "MSRP & NET - INOX Smart SaaS Quoting Workspace",
};

export default function MsrpWithNetPricingPage() {
  return <PricingConfigurator pricingMode="both" />;
}
