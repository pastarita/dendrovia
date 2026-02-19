/**
 * OCULUS: Heads-Up Display
 *
 * Demonstrates the "Iron Man HUD" concept - peripheral awareness without blocking the view.
 */

import React, { useEffect, useState } from 'react';
import { getEventBus, GameEvents } from '@dendrovia/shared';

export function HUD() {
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const eventBus = getEventBus();

    const unsubscribe = eventBus.on(
      GameEvents.NODE_CLICKED,
      (data) => {
        setLastClicked(data.filePath);
        setEventCount(c => c + 1);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div className="hud">
      <div className="hud-panel">
        <h4>Dendrovia POC</h4>
        <div className="hud-stats">
          <div>Mode: <span className="highlight">Falcon</span></div>
          <div>Events: <span className="highlight">{eventCount}</span></div>
          {lastClicked && (
            <div>Last Clicked: <span className="highlight">{lastClicked}</span></div>
          )}
        </div>
      </div>

      <div className="hud-legend">
        <h5>Controls</h5>
        <ul>
          <li>🖱️ Left Click: Orbit</li>
          <li>🎯 Click Branch: View Code</li>
          <li>🔍 Scroll: Zoom</li>
        </ul>
      </div>
    </div>
  );
}
