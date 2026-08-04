/* eslint-disable @next/next/no-img-element -- local brand asset must remain a direct static URL on Netlify */

import { APP_CONFIG } from "@/app/config/pricing";
import Link from "next/link";
import { WorkspaceNav } from "./WorkspaceNav";
import styles from "./WorkspaceSettings.module.css";

export function WorkspaceSettings() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link aria-label="INOX Smart SaaS quoting tool" className={styles.brand} href="/quoting">
          <img alt="INOX Smart" className={styles.logo} height="37" src="/brand/inox-smart-logo-dark.png" width="279" />
          <span>SaaS Quoting Workspace</span>
        </Link>
        <WorkspaceNav />
        <div className={styles.topbarMeta}>
          <span className={styles.saveState}>Pricing Version: 20260629</span>
          <span className={styles.version}>v3.5 by Ayden</span>
        </div>
      </header>

      <section className={styles.content} aria-labelledby="settings-title">
        <p className="section-kicker">Workspace settings</p>
        <h1 id="settings-title">Pricing workspace details</h1>
        <p className={styles.intro}>This workspace uses the centrally configured pricing rules. Quote data is not stored in this browser after a page session ends.</p>
        <dl className={styles.details}>
          <div><dt>Pricing version</dt><dd>20260629</dd></div>
          <div><dt>Currency</dt><dd>{APP_CONFIG.currency}</dd></div>
          <div><dt>Export format</dt><dd>US Letter PDF</dd></div>
          <div><dt>Session handling</dt><dd>Browser session cookie</dd></div>
        </dl>
        <p className={styles.note}>To update plan pricing, included capacity, or product features, edit the workspace configuration in VS Code and publish the approved update.</p>
      </section>
    </main>
  );
}
