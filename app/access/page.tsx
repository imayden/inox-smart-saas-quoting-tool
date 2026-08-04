import type { Metadata } from "next";
import { AccessScreen } from "../components/AccessScreen";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Access required - INOX Smart SaaS Quoting Workspace",
};

export default function AccessPage() {
  return <AccessScreen />;
}
