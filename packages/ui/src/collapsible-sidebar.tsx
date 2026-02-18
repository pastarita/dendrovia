"use client";

import { useSidebar } from "./sidebar-provider";

// Re-export for consumers
export { useSidebar, useSidebarMaybe } from "./sidebar-provider";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 52;

export function CollapsibleSidebar({
  pillarHex,
  children,
}: {
  pillarHex: string;
  children: React.ReactNode;
}) {
  const { collapsed, toggle } = useSidebar();
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <nav
      style={{
        width,
        minWidth: width,
        borderRight: `2px solid ${pillarHex}`,
        padding: collapsed ? "1rem 0.25rem" : "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: collapsed ? "0.5rem" : "1.5rem",
        flexShrink: 0,
        background: "#111",
        transition: "width 400ms cubic-bezier(0.34, 1.56, 0.64, 1), min-width 400ms cubic-bezier(0.34, 1.56, 0.64, 1), padding 300ms ease",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}

      {/* Toggle button at bottom */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          bottom: "0.75rem",
          right: collapsed ? "50%" : "0.75rem",
          transform: collapsed ? "translateX(50%)" : undefined,
          background: "transparent",
          border: "1px solid #333",
          borderRadius: "4px",
          color: "#888",
          cursor: "pointer",
          padding: "0.2rem 0.4rem",
          fontSize: "0.75rem",
          lineHeight: 1,
          transition: "opacity 0.15s, color 0.15s",
          opacity: 0.5,
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.color = pillarHex;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.5";
          e.currentTarget.style.color = "#888";
        }}
      >
        {collapsed ? "\u25B7" : "\u25C1"}
      </button>
    </nav>
  );
}
