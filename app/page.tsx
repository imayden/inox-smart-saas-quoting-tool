import type { Metadata } from "next";
import { WorkspaceAccessNotice } from "./components/WorkspaceAccessNotice";

export const metadata: Metadata = {
  title: "SaaS Quoting Workspace - INOX Smart",
};

export default function Home() {
  return <WorkspaceAccessNotice />;
}
