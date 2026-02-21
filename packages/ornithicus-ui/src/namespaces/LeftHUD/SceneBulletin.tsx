/**
 * SceneBulletin — Activity feed in the left HUD.
 * Shows recent events: file changes, navigation actions, system messages.
 */

import React from "react";

export interface BulletinEntry {
  id: string;
  message: string;
  timestamp: number;
  type: "info" | "action" | "warning";
}

export interface SceneBulletinProps {
  entries?: BulletinEntry[];
}

export const SceneBulletin: React.FC<SceneBulletinProps> = ({
  entries = [],
}) => {
  return (
    <div className="ornithicus-scene-bulletin">
      {entries.map((entry) => (
        <div key={entry.id} className={`bulletin-entry bulletin-${entry.type}`}>
          {entry.message}
        </div>
      ))}
    </div>
  );
};
