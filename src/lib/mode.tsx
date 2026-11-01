import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ShoppingMode = "retail" | "business";

type ModeContextValue = {
  mode: ShoppingMode;
  setMode: (mode: ShoppingMode) => void;
  hydrated: boolean;
};

const STORAGE_KEY = "kalacart.mode.v1";
const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ShoppingMode>("retail");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "business" || raw === "retail") setModeState(raw);
    } catch {
      /* ignore blocked storage */
    }
    setHydrated(true);
  }, []);

  const setMode = (next: ShoppingMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage full or blocked */
    }
  };

  return <ModeContext.Provider value={{ mode, setMode, hydrated }}>{children}</ModeContext.Provider>;
}

export function useShoppingMode(): { isBusiness: boolean; setMode: (mode: ShoppingMode) => void } {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useShoppingMode must be used within ModeProvider");
  // Stay on retail rendering until localStorage has been read, so SSR and the
  // first client render always match (no hydration mismatch).
  return { isBusiness: ctx.hydrated && ctx.mode === "business", setMode: ctx.setMode };
}
