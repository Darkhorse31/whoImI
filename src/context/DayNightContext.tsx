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
  const [mode, setMode] = useState<Mode>(getAutoMode);

  /* sync with real time every minute (only if user hasn't manually toggled) */
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual) return;
    const id = setInterval(() => setMode(getAutoMode()), 60_000);
    return () => clearInterval(id);
  }, [manual]);

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
