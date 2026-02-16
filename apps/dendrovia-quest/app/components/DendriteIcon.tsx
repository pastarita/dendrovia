/**
 * DendriteIcon — Six-branch tree SVG extracted from DendroviaQuest LoadingScreen.
 *
 * Server Component. Reusable across landing page, loading screen, class select.
 * Shows the Dendrovia tree with pillar-colored branch tips.
 */

interface DendriteIconProps {
  size?: number;
}

export function DendriteIcon({ size = 48 }: DendriteIconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ opacity: 0.9 }}>
      <circle cx="16" cy="16" r="15" fill="#1a1514" stroke="#4a3822" strokeWidth="1" />
      <path d="M16 28L16 13" stroke="#f5e6d3" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 13Q11 9 6 5" stroke="#c77b3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 13Q12 11 8 8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 13Q14 8 12 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 13Q18 8 20 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 13Q20 11 24 8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 13Q21 9 26 5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="6" cy="5" r="1.5" fill="#c77b3f" />
      <circle cx="8" cy="8" r="1.5" fill="#6b7280" />
      <circle cx="12" cy="4" r="1.5" fill="#A855F7" />
      <circle cx="20" cy="4" r="1.5" fill="#3B82F6" />
      <circle cx="24" cy="8" r="1.5" fill="#EF4444" />
      <circle cx="26" cy="5" r="1.5" fill="#22C55E" />
    </svg>
  );
}
