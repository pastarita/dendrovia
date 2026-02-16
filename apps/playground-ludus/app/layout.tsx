import type { Metadata } from "next";
import localFont from "next/font/local";
import { PillarNav } from "@repo/ui/pillar-nav";
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
  title: "LUDUS Playground",
  description: "The Gamemaster — Game Mechanics + Rules playground",
};

const DOMAINS = [
  { name: "Museums", href: "/museums", icon: "🏛️" },
  { name: "Zoos", href: "/zoos", icon: "🦁" },
  { name: "Halls", href: "/halls", icon: "🏰" },
  { name: "Gyms", href: "/gyms", icon: "🏋️" },
  { name: "Generators", href: "/generators", icon: "⚡" },
  { name: "Spatial Docs", href: "/spatial-docs", icon: "📐" },
];


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
              <span>🎮</span>
              <span style={{ color: "var(--pillar-accent)" }}>LUDUS</span>
            </a>
            <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>:3014 · Gules</div>

            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.5rem" }}>
                SpacePark Domains
              </div>
              {DOMAINS.map((d) => (
                <a
                  key={d.href}
                  href={d.href}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "4px", fontSize: "0.9rem" }}
                >
                  <span>{d.icon}</span>
                  <span>{d.name}</span>
                </a>
              ))}
            </div>

            <PillarNav currentPillar="LUDUS" />
          </nav>
          <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
