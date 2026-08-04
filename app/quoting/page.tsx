import type { Metadata } from "next";
import { PricingConfigurator } from "../components/PricingConfigurator";

export const metadata: Metadata = {
  title: "Quoting - INOX Smart SaaS Quoting Workspace",
};

export default function QuotingPage() {
  return <PricingConfigurator pricingMode="both" />;
}
