import styles from "./WorkspaceAccessNotice.module.css";

export function WorkspaceAccessNotice() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="access-heading">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="INOX Smart"
          className={styles.logo}
          height="37"
          src="/brand/inox-smart-logo-dark.png"
          width="279"
        />
        <div className={styles.rule} />
        <p className={styles.kicker}>Quoting Workspace</p>
        <h1 id="access-heading">Workspace access required</h1>
        <p className={styles.copy}>
          Please contact INOX Smart Admin{" "}
          <a href="mailto:inoxsmartadmin@unisonhardware.com">
            inoxsmartadmin@unisonhardware.com
          </a>{" "}
          or contact Ayden Deng through Teams to obtain the specific Quoting Workspace
          tool URL.
        </p>
      </section>
    </main>
  );
}
