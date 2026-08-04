import type { Metadata } from "next";
import { PricingConfigurator } from "../components/PricingConfigurator";

export const metadata: Metadata = {
  title: "Plans - INOX Smart SaaS Quoting Workspace",
};

export default function PlansPage() {
  return <PricingConfigurator pricingMode="both" />;
}
