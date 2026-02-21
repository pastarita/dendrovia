/**
 * AppRouter — Switches between Lander (2D) and Engine (3D) views.
 * The lander provides the entry point (URL input, repo grid).
 * The engine view provides the full 3D spatial editor.
 */

import React, { useState } from "react";
import { LanderView } from "./views/LanderView";
import { EngineView } from "./views/EngineView";

export type AppView = "lander" | "engine";

export const AppRouter: React.FC = () => {
  const [view, setView] = useState<AppView>("lander");
  const [repoUrl, setRepoUrl] = useState<string>("");

  const handleLaunch = (url: string) => {
    setRepoUrl(url);
    setView("engine");
  };

  const handleBack = () => {
    setView("lander");
  };

  switch (view) {
    case "lander":
      return <LanderView onLaunch={handleLaunch} />;
    case "engine":
      return <EngineView repoUrl={repoUrl} onBack={handleBack} />;
  }
};
