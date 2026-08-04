"use client";

import { FormEvent, useState } from "react";
import styles from "./AccessScreen.module.css";

export function AccessScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quoting-login", {
        body: JSON.stringify({ password }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Unable to verify the access code. Please try again.");
        return;
      }
      // Use a document navigation after the Function has set the HttpOnly
      // cookie. This guarantees the protected root request includes it and
      // returns the three quote-entry choices rather than a nested view.
      window.location.assign("/");
    } catch {
      setError("Unable to reach the access service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="INOX Smart" className={styles.logo} height="37" src="/brand/inox-smart-logo-dark.png" width="279" />
        <span>SaaS Quoting Workspace</span>
      </header>

      <section className={styles.card} aria-labelledby="access-title">
        <p className="section-kicker">Secure workspace</p>
        <h1 id="access-title">Access the quoting workspace</h1>
        <p className={styles.description}>
          Enter the administrator access code to configure plans and create a customer-ready quote.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="access-code">Access code</label>
          <div className={styles.passwordField}>
            <input
              autoComplete="current-password"
              disabled={isSubmitting}
              id="access-code"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter access code"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide access code" : "Show access code"}
              className={styles.visibilityButton}
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying access…" : "Continue to workspace"}
          </button>
        </form>

        <p className={styles.note}>
          Your session is kept only in this browser and ends when the browser session is closed or its cookies are cleared.
        </p>
      </section>
    </main>
  );
}
