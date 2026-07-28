import type { Metadata } from "next";
import { WorkspaceAccessNotice } from "./components/WorkspaceAccessNotice";

export const metadata: Metadata = {
  title: "Contact Admin - INOX Smart SaaS Quoting Workspace",
};

export default function Home() {
  return <WorkspaceAccessNotice />;
}
