import Link from "next/link";
import styles from "./WorkspaceAccessNotice.module.css";

const workspaces = [
  { href: "/16E5/NET-pricing", label: "Quote NET", note: "Partner-facing NET pricing" },
  { href: "/22625/MSRP-pricing", label: "Quote MSRP", note: "Customer-facing MSRP pricing" },
  { href: "/16E522625/MSRP_w_NET", label: "Quote NET & MSRP", note: "Compare both price levels" },
] as const;

export function WorkspaceAccessNotice() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="access-heading">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="INOX Smart" className={styles.logo} height="37" src="/brand/inox-smart-logo-dark.png" width="279" />
        <div className={styles.rule} />
        <p className={styles.kicker}>SaaS Quoting Workspace</p>
        <h1 id="access-heading">Choose a pricing workspace</h1>
        <p className={styles.copy}>Select the pricing view you need. You can switch between pricing views at any time.</p>
        <div className={styles.workspaceLinks}>
          {workspaces.map((workspace) => (
            <Link href={workspace.href} key={workspace.href}>
              <strong>{workspace.label}</strong>
              <span>{workspace.note}</span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
        <footer className={styles.help}>
          If you need assistance, contact INOX Smart Admin{" "}
          <a href="mailto:inoxsmartadmin@unisonhardware.com">inoxsmartadmin@unisonhardware.com</a>{" "}
          or contact Ayden Deng through Teams.
        </footer>
      </section>
    </main>
  );
}
