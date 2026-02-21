/**
 * @ornithicus/ui
 *
 * UI components for the Ornithicus spatial codebase editor.
 * Organized by HUD namespace position.
 *
 * Namespaces:
 *   - TopHeader/  — Project catalog, Miller breadcrumb navigation
 *   - LeftHUD/    — Scene bulletin, chat event stream
 *   - RightHUD/   — Minimap, control toggles
 *   - Floating/   — Hover code reader (Drei→Oculus handoff)
 *   - styling/    — Cyber-organic theme (translucent panels, amber accents)
 */

// TopHeader
export { ProjectCatalog } from "./namespaces/TopHeader/ProjectCatalog";
export { MillerBreadcrumb } from "./namespaces/TopHeader/MillerBreadcrumb";

// LeftHUD
export { SceneBulletin } from "./namespaces/LeftHUD/SceneBulletin";
export { ChatEventStream } from "./namespaces/LeftHUD/ChatEventStream";

// RightHUD
export { Minimap } from "./namespaces/RightHUD/Minimap";
export { ControlToggles } from "./namespaces/RightHUD/ControlToggles";

// Floating
export { HoverCodeReader } from "./namespaces/Floating/HoverCodeReader";

// Styling
export { CyberOrganicTheme } from "./styling/CyberOrganicTheme";
