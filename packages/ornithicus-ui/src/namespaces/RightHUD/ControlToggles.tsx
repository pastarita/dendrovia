/**
 * ControlToggles — Display and interaction toggle buttons in the right HUD.
 * Allows toggling wireframe, labels, diff overlay, minimap, etc.
 */

import React from "react";

export interface Toggle {
  id: string;
  label: string;
  active: boolean;
}

export interface ControlTogglesProps {
  toggles?: Toggle[];
  onToggle?: (id: string) => void;
}

export const ControlToggles: React.FC<ControlTogglesProps> = ({
  toggles = [],
  onToggle,
}) => {
  return (
    <div className="ornithicus-control-toggles">
      {toggles.map((t) => (
        <button
          key={t.id}
          className={t.active ? "active" : ""}
          onClick={() => onToggle?.(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};
