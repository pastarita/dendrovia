/**
 * ProjectCatalog — Dropdown project switcher in the top header.
 * Displays available repositories and allows switching the active project.
 */

import React from "react";

export interface ProjectCatalogProps {
  projects?: string[];
  activeProject?: string;
  onSelect?: (project: string) => void;
}

export const ProjectCatalog: React.FC<ProjectCatalogProps> = ({
  projects = [],
  activeProject,
  onSelect,
}) => {
  return (
    <div className="ornithicus-project-catalog">
      <select
        value={activeProject}
        onChange={(e) => onSelect?.(e.target.value)}
      >
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
};
