/**
 * LanderView — Rich landing page with firebird hero, Ornithicus typelogo,
 * search bar, pre-rendered world cards with dendritic viewlets, and ENTER CTA.
 *
 * Layout: Firebird background (left, faded/feathered) + content panel (right)
 */

import React, { useState, useMemo } from "react";
import type { WorldEntry } from "../../../page";
import { generateWorldViewlet } from "./world-viewlet-svg";

// ─── Language Color Mapping ─────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  Javascript: "#F7DF1E",
  Typescript: "#3178C6",
  Python: "#3776AB",
  Rust: "#CE422B",
  Go: "#00ADD8",
  Java: "#ED8B00",
  Markdown: "#083FA1",
  Css: "#264de4",
  Html: "#e34c26",
  Json: "#6d6d6d",
  Yaml: "#cb171e",
  Shell: "#89e051",
  Unknown: "#4a4543",
};

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "#6b7280";
}

// ─── Relative Time Formatter ────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);

  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  if (diffD < 30) return `${Math.floor(diffD / 7)}w ago`;
  return `${Math.floor(diffD / 30)}mo ago`;
}

// ─── Search Icon ────────────────────────────────────────────

const SearchIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8.5" cy="8.5" r="5.5" stroke="#6b6563" strokeWidth="2" />
    <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#6b6563" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ─── Language Bar ───────────────────────────────────────────

const LanguageBar: React.FC<{
  languages: Array<{ language: string; percentage: number }>;
}> = ({ languages }) => (
  <div style={{ display: "flex", width: "100%", height: 4, borderRadius: 2, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
    {languages.slice(0, 5).map((lang) => (
      <div key={lang.language} style={{ width: `${lang.percentage}%`, background: getLangColor(lang.language), minWidth: 2 }} />
    ))}
  </div>
);

// ─── World Card ─────────────────────────────────────────────

const WorldCard: React.FC<{ world: WorldEntry; onClick: () => void }> = ({ world, onClick }) => {
  const primaryLang = world.stats.languages[0];

  const viewletSvg = useMemo(
    () =>
      generateWorldViewlet({
        fileCount: world.stats.fileCount,
        commitCount: world.stats.commitCount,
        hotspotCount: world.stats.hotspotCount,
        languages: world.stats.languages,
        tincture: world.tincture.hex,
      }),
    [world.slug],
  );

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "14px 16px",
        background: "rgba(30, 24, 18, 0.7)",
        border: "1px solid rgba(199, 123, 63, 0.25)",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        color: "#e8dcc8",
        transition: "border-color 0.2s, background 0.2s",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(199, 123, 63, 0.6)";
        e.currentTarget.style.background = "rgba(30, 24, 18, 0.9)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(199, 123, 63, 0.25)";
        e.currentTarget.style.background = "rgba(30, 24, 18, 0.7)";
      }}
    >
      {/* Header: slug + tree viewlet */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
          {world.slug}
        </span>
        <div
          style={{ width: 48, height: 48, flexShrink: 0 }}
          dangerouslySetInnerHTML={{ __html: viewletSvg.replace(/width="120" height="120"/, 'width="48" height="48"') }}
        />
      </div>

      {/* Language bar */}
      <LanguageBar languages={world.stats.languages} />

      {/* Footer: primary language + parsed time */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, opacity: 0.6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: primaryLang ? getLangColor(primaryLang.language) : "#6b7280",
              display: "inline-block",
            }}
          />
          {primaryLang ? `${primaryLang.language} ${Math.round(primaryLang.percentage)}%` : "Unknown"}
        </span>
        <span>Parsed: {relativeTime(world.analyzedAt)}</span>
      </div>
    </button>
  );
};

// ─── LanderView ─────────────────────────────────────────────

export interface LanderViewProps {
  worlds: WorldEntry[];
  onLaunch: (url: string) => void;
}

export const LanderView: React.FC<LanderViewProps> = ({ worlds, onLaunch }) => {
  const [searchValue, setSearchValue] = useState("");

  const filteredWorlds = worlds.filter((w) => {
    if (!searchValue.trim()) return true;
    const q = searchValue.toLowerCase();
    return w.slug.toLowerCase().includes(q) || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchValue.trim();
    if (!v) return;
    if (v.startsWith("http") || v.includes("github.com")) {
      onLaunch(v);
      return;
    }
    const match = worlds.find((w) => w.slug.toLowerCase() === v.toLowerCase());
    if (match) onLaunch(`https://github.com/${match.slug}`);
  };

  const handleWorldClick = (world: WorldEntry) => {
    onLaunch(`https://github.com/${world.slug}`);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* ─── Firebird Background (Left) ─── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "55%",
          height: "100%",
          backgroundImage: "url(/firebird.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      >
        {/* Feathered fade right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "100%",
            background: "linear-gradient(to left, #0a0806 0%, rgba(10,8,6,0.85) 30%, rgba(10,8,6,0.4) 60%, transparent 100%)",
          }}
        />
        {/* Fade bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "30%",
            background: "linear-gradient(to top, #0a0806 0%, transparent 100%)",
          }}
        />
        {/* Vignette top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "20%",
            background: "linear-gradient(to bottom, rgba(10,8,6,0.5) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ─── Content Panel (Right) ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginLeft: "auto",
          width: "55%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "40px 48px",
          gap: 20,
        }}
      >
        {/* Ornithicus Typelogo */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}>
          <img
            src="/ornithicus-typelogo.svg"
            alt="Ornithicus"
            style={{
              height: 56,
              objectFit: "contain",
              filter: "drop-shadow(0 2px 12px rgba(199, 123, 63, 0.15))",
            }}
          />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "rgba(30, 24, 18, 0.6)",
              border: "1px solid rgba(199, 123, 63, 0.2)",
              borderRadius: 8,
              backdropFilter: "blur(8px)",
            }}
          >
            <SearchIcon />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Paste a GitHub URL or search..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e8dcc8",
                fontSize: 15,
                fontFamily: "JetBrains Mono, monospace",
              }}
            />
          </div>
        </form>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "linear-gradient(to right, transparent, rgba(199,123,63,0.3), transparent)" }} />

        {/* World Cards Grid */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            alignContent: "start",
            paddingRight: 4,
          }}
        >
          {filteredWorlds.map((world) => (
            <WorldCard key={world.slug} world={world} onClick={() => handleWorldClick(world)} />
          ))}
          {filteredWorlds.length === 0 && searchValue.trim() && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 32, opacity: 0.4, fontSize: 14 }}>
              No worlds found. Paste a full GitHub URL to analyze a new repository.
            </div>
          )}
        </div>

        {/* ENTER Button */}
        <button
          onClick={handleSubmit as unknown as React.MouseEventHandler}
          style={{
            width: "100%",
            padding: "16px 0",
            background: "linear-gradient(to bottom, #c77b3f, #a86830)",
            border: "1px solid rgba(199, 123, 63, 0.5)",
            borderRadius: 8,
            color: "#0a0806",
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: 6,
            cursor: "pointer",
            transition: "opacity 0.2s",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          ENTER
        </button>
      </div>
    </div>
  );
};
