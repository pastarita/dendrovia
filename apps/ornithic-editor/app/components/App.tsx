/**
 * App — Root component for Ornithic Editor.
 * Provides R3F Canvas and EventBus context.
 * Routes between LanderView (2D) and EngineView (3D).
 */

import React from "react";
import { AppRouter } from "./router";

export const App: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <AppRouter />
    </div>
  );
};
