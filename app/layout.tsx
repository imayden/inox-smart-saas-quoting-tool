import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.URL ?? "https://inox-smart-saas-quoting-tool.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "INOX Smart SaaS Quoting Tool",
  description:
    "Configure INOX Smart SaaS plans, calculate add-ons, and export a branded PDF quote.",
  icons: {
    icon: "/brand/xs-logo.png",
    shortcut: "/brand/xs-logo.png",
  },
  openGraph: {
    title: "INOX Smart SaaS Quoting Tool",
    description: "Configure. Compare. Quote.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "INOX Smart SaaS Quoting Tool",
    description: "Configure. Compare. Quote.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
