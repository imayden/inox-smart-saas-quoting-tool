"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./WorkspaceNav.module.css";

const links = [
  { href: "/16E5/NET-pricing", label: "Quote NET" },
  { href: "/22625/MSRP-pricing", label: "Quote MSRP" },
  { href: "/16E522625/MSRP_w_NET", label: "Quote NET & MSRP" },
] as const;

export function WorkspaceNav() {
  const pathname = usePathname();
  const activePath = links.find((link) => pathname.startsWith(link.href))?.href;

  return (
    <nav aria-label="Pricing workspace shortcuts" className={styles.nav}>
      {links.map((link) => (
        <Link
          aria-current={activePath === link.href ? "page" : undefined}
          className={activePath === link.href ? styles.active : undefined}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
