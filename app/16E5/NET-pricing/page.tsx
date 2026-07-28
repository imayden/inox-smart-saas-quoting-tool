import { PricingConfigurator } from "@/app/components/PricingConfigurator";

// Hexadecimal 16E5 converts to decimal 5861.
export default function NetPricingPage() {
  return <PricingConfigurator pricingMode="net" />;
}
