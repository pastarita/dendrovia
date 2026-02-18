"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const STORAGE_KEY = "playground-sidebar-collapsed";

export const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar() must be used inside <SidebarProvider>");
  return ctx;
}

/** Safe version that returns null when outside SidebarProvider */
export function useSidebarMaybe(): SidebarState | null {
  return useContext(SidebarContext);
}

function readStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStorage(v: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    /* SSR or private browsing */
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedRaw] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setCollapsedRaw(readStorage());
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedRaw(v);
    writeStorage(v);
  }, []);

  const toggle = useCallback(() => {
    setCollapsedRaw((prev) => {
      const next = !prev;
      writeStorage(next);
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
