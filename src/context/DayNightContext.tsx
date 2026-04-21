"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type Mode = "day" | "night";

interface DayNightContextType {
  mode: Mode;
  toggle: () => void;
}

const DayNightContext = createContext<DayNightContextType>({
  mode: "night",
  toggle: () => {},
});

export function useDayNight() {
  return useContext(DayNightContext);
}

function getAutoMode(): Mode {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

export function DayNightProvider({ children }: { children: ReactNode }) {
  /* Start with a fixed default so server & client HTML match (no hydration mismatch).
     The real time-based mode is applied in the useEffect below (client-only). */
  const [mode, setMode] = useState<Mode>("night");
  const [mounted, setMounted] = useState(false);

  /* sync with real time every minute (only if user hasn't manually toggled) */
  const [manual, setManual] = useState(false);

  /* Hydrate with the real time-based mode after mount */
  useEffect(() => {
    setMode(getAutoMode());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || manual) return;
    const id = setInterval(() => setMode(getAutoMode()), 60_000);
    return () => clearInterval(id);
  }, [mounted, manual]);

  /* sync data-mode attribute on <html> for CSS variable switching */
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setManual(true);
    setMode((prev) => (prev === "day" ? "night" : "day"));
  }, []);

  return (
    <DayNightContext.Provider value={{ mode, toggle }}>
      {children}
    </DayNightContext.Provider>
  );
}
