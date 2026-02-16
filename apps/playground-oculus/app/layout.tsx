import type { Metadata } from "next";
import localFont from "next/font/local";
import { PillarNav } from "@repo/ui/pillar-nav";
import { DomainNav } from "@repo/ui/domain-nav";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "OCULUS Playground",
  description: "The Seer — UI + Navigation playground",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <nav
            style={{
              width: "var(--sidebar-width)",
              borderRight: "2px solid var(--pillar-accent)",
              padding: "1.5rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              flexShrink: 0,
              background: "#111",
            }}
          >
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
              <span>👁️</span>
              <span style={{ color: "var(--pillar-accent)" }}>OCULUS</span>
            </a>
            <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>:3015 · Vert</div>

            <DomainNav currentPillar="OCULUS" />

            <PillarNav currentPillar="OCULUS" />
          </nav>
          <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
