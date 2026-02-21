import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ornithicus — Spatial Codebase Editor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0806 0%, #1a1510 50%, #0a0806 100%)",
          color: "#e8dcc8",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 300,
            letterSpacing: "-0.02em",
            color: "#c77b3f",
          }}
        >
          Ornithicus
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.6,
            marginTop: 16,
          }}
        >
          Spatial Codebase Editor
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            opacity: 0.4,
            fontSize: 14,
          }}
        >
          <span>CHRONOS</span>
          <span>IMAGINARIUM</span>
          <span>ARCHITECTUS</span>
          <span>OCULUS</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
