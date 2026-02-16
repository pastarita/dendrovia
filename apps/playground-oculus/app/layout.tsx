import type { Metadata } from "next";
import localFont from "next/font/local";
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

const DOMAINS = [
  { name: "Museums", href: "/museums", icon: "🏛️" },
  { name: "Zoos", href: "/zoos", icon: "🦁" },
  { name: "Halls", href: "/halls", icon: "🏰" },
  { name: "Gyms", href: "/gyms", icon: "🏋️" },
  { name: "Generators", href: "/generators", icon: "⚡" },
  { name: "Spatial Docs", href: "/spatial-docs", icon: "📐" },
];

const CROSS_NAV = [
  { name: "ARCHITECTUS", port: 3010, emoji: "🏛️" },
  { name: "CHRONOS", port: 3011, emoji: "📜" },
  { name: "IMAGINARIUM", port: 3012, emoji: "🎨" },
  { name: "LUDUS", port: 3013, emoji: "🎮" },
  { name: "OPERATUS", port: 3015, emoji: "💾" },
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
              <span>👁️</span>
              <span style={{ color: "var(--pillar-accent)" }}>OCULUS</span>
            </a>
            <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>:3015 · Vert</div>

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

            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.5rem" }}>
                Other Pillars
              </div>
              {CROSS_NAV.map((p) => (
                <a
                  key={p.port}
                  href={`http://localhost:${p.port}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem" }}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                  <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>:{p.port}</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: "auto" }}>
              <a
                href="http://localhost:3010"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "4px", fontSize: "0.85rem", border: "1px solid #333" }}
              >
                🌳 Dendrovia Quest <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>:3010</span>
              </a>
            </div>
          </nav>
          <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
