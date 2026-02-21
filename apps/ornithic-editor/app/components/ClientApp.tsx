/**
 * ClientApp — Client-side root that receives server-loaded worlds
 * and routes between LanderView (2D) and EngineView (3D).
 */

"use client";

import React, { useState } from "react";
import { LanderView } from "./views/LanderView";
import { EngineView } from "./views/EngineView";
import type { WorldEntry } from "../page";

export type AppView = "lander" | "engine";

interface ClientAppProps {
  worlds: WorldEntry[];
}

export const ClientApp: React.FC<ClientAppProps> = ({ worlds }) => {
  const [view, setView] = useState<AppView>("lander");
  const [repoUrl, setRepoUrl] = useState<string>("");

  const handleLaunch = (url: string) => {
    setRepoUrl(url);
    setView("engine");
  };

  const handleBack = () => {
    setView("lander");
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {view === "lander" ? (
        <LanderView worlds={worlds} onLaunch={handleLaunch} />
      ) : (
        <EngineView repoUrl={repoUrl} onBack={handleBack} />
      )}
    </div>
  );
};
