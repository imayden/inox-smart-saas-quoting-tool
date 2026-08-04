import type { Metadata } from "next";
import { WorkspaceSettings } from "../components/WorkspaceSettings";

export const metadata: Metadata = {
  title: "Settings - INOX Smart SaaS Quoting Workspace",
};

export default function SettingsPage() {
  return <WorkspaceSettings />;
}
