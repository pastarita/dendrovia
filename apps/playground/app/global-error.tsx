"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "#ededed", fontFamily: "system-ui" }}>
        <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.5rem",
              background: "#333",
              border: "1px solid #555",
              borderRadius: "6px",
              color: "#ededed",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
