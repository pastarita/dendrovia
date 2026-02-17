/**
 * MushroomSprite — React component wrapping generated SVGs.
 *
 * Supports icon (32px), card (128px), and detail (512px) sizes.
 * Glow animation via CSS keyframes when bioluminescent.
 * Accessible: aria-label with species name, role="img".
 */

import type React from 'react';
import type { FungalSpecimen } from '../types';
import { generateSvg } from './SvgTemplates';

export interface MushroomSpriteProps {
  specimen: FungalSpecimen;
  size?: 'icon' | 'card' | 'detail';
  glow?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  icon: 32,
  card: 128,
  detail: 512,
} as const;

export function MushroomSprite({ specimen, size = 'card', glow, onClick }: MushroomSpriteProps): React.JSX.Element {
  const px = SIZE_MAP[size];
  const svgString = generateSvg(specimen);
  const speciesName = `${specimen.taxonomy.genus} ${specimen.taxonomy.species}`;

  const shouldGlow = glow ?? specimen.morphology.bioluminescence !== 'none';

  const containerStyle: React.CSSProperties = {
    width: px,
    height: px,
    display: 'inline-block',
    cursor: onClick ? 'pointer' : 'default',
    animation: shouldGlow ? 'mushroomGlow 2s ease-in-out infinite' : undefined,
  };

  return (
    <>
      {shouldGlow && (
        <style>{`
          @keyframes mushroomGlow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.4) drop-shadow(0 0 8px ${specimen.morphology.scaleColor}); }
          }
        `}</style>
      )}
      <div
        role="img"
        aria-label={speciesName}
        style={containerStyle}
        onClick={onClick}
        dangerouslySetInnerHTML={{
          __html: svgString.replace(`width="200" height="200"`, `width="${px}" height="${px}"`),
        }}
      />
    </>
  );
}
