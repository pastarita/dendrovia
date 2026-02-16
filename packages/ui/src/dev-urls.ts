/**
 * Dev-only URL helper for cross-pillar navigation.
 *
 * In local development, each pillar runs on its own port (3010-3016, 3030+).
 * In production, only the quest app is deployed — cross-pillar links are hidden.
 */

export function devUrl(port: number, path = ""): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return path || "/";
  }
  return `http://localhost:${port}${path}`;
}

export function isDevEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
