"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

/* ─── Theme presets ─── */
export interface ThemeColors {
  primary: string;
  accent: string;
  bg: string;
  text: string;
  card: string;
  border: string;
  surface: string;
}

export const THEME_PRESETS: Record<string, ThemeColors> = {
  default: {
    primary: "#ffffff",
    accent: "#d4a96a",
    bg: "#0c0c0c",
    text: "#fbf8f4",
    card: "#161616",
    border: "#383838",
    surface: "#161616",
  },
  ocean: {
    primary: "#e0f0ff",
    accent: "#38bdf8",
    bg: "#0a1628",
    text: "#e0f0ff",
    card: "#0f2240",
    border: "#1e3a5f",
    surface: "#0f2240",
  },
  forest: {
    primary: "#e8f5e9",
    accent: "#4caf50",
    bg: "#0a1a0e",
    text: "#e8f5e9",
    card: "#132a17",
    border: "#1e4d25",
    surface: "#132a17",
  },
  sunset: {
    primary: "#fff3e0",
    accent: "#ff6b35",
    bg: "#1a0d08",
    text: "#fff3e0",
    card: "#2a1810",
    border: "#5a3020",
    surface: "#2a1810",
  },
  lavender: {
    primary: "#f3e8ff",
    accent: "#a78bfa",
    bg: "#110d1a",
    text: "#f3e8ff",
    card: "#1c1528",
    border: "#362a50",
    surface: "#1c1528",
  },
  rose: {
    primary: "#ffe4e6",
    accent: "#fb7185",
    bg: "#1a0a0e",
    text: "#ffe4e6",
    card: "#2a1218",
    border: "#5a2030",
    surface: "#2a1218",
  },
};

/* ─── Context shape ─── */
export interface CustomizationState {
  sidebarOpen: boolean;
  snowEnabled: boolean;
  filmGrainEnabled: boolean;
  particlesEnabled: boolean;
  animationsEnabled: boolean;
  themePreset: string;
  customColors: ThemeColors;
}

interface CustomizationContextType extends CustomizationState {
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSnowEnabled: (v: boolean) => void;
  setFilmGrainEnabled: (v: boolean) => void;
  setParticlesEnabled: (v: boolean) => void;
  setAnimationsEnabled: (v: boolean) => void;
  setThemePreset: (preset: string) => void;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetAll: () => void;
}

const defaults: CustomizationState = {
  sidebarOpen: false,
  snowEnabled: false,
  filmGrainEnabled: true,
  particlesEnabled: true,
  animationsEnabled: true,
  themePreset: "default",
  customColors: THEME_PRESETS.default,
};

const CustomizationContext = createContext<CustomizationContextType>({
  ...defaults,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  setSnowEnabled: () => {},
  setFilmGrainEnabled: () => {},
  setParticlesEnabled: () => {},
  setAnimationsEnabled: () => {},
  setThemePreset: () => {},
  setCustomColor: () => {},
  resetAll: () => {},
});

export function useCustomization() {
  return useContext(CustomizationContext);
}

const STORAGE_KEY = "portfolio-customization";

function loadFromStorage(): Partial<CustomizationState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToStorage(state: CustomizationState) {
  if (typeof window === "undefined") return;
  try {
    const { sidebarOpen, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* quota exceeded — ignore */
  }
}

/* ─── Apply CSS custom properties to :root ─── */
function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-bg", colors.bg);
  root.style.setProperty("--color-text", colors.text);
  root.style.setProperty("--color-card", colors.card);
  root.style.setProperty("--color-border", colors.border);
  root.style.setProperty("--color-surface", colors.surface);
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomizationState>(() => ({
    ...defaults,
    ...loadFromStorage(),
    sidebarOpen: false, // always start closed
  }));

  /* Persist on change */
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  /* Apply CSS vars when colors change (only in night mode — day overrides itself) */
  useEffect(() => {
    const mode = document.documentElement.getAttribute("data-mode");
    if (mode !== "day") {
      applyThemeColors(state.customColors);
    }
  }, [state.customColors]);

  /* Re-apply when switching back to night */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const mode = document.documentElement.getAttribute("data-mode");
      if (mode !== "day") {
        applyThemeColors(state.customColors);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });
    return () => observer.disconnect();
  }, [state.customColors]);

  const toggleSidebar = useCallback(
    () => setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
    [],
  );
  const closeSidebar = useCallback(
    () => setState((s) => ({ ...s, sidebarOpen: false })),
    [],
  );
  const setSnowEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, snowEnabled: v })),
    [],
  );
  const setFilmGrainEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, filmGrainEnabled: v })),
    [],
  );
  const setParticlesEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, particlesEnabled: v })),
    [],
  );
  const setAnimationsEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, animationsEnabled: v })),
    [],
  );
  const setThemePreset = useCallback((preset: string) => {
    const colors = THEME_PRESETS[preset] ?? THEME_PRESETS.default;
    setState((s) => ({
      ...s,
      themePreset: preset,
      customColors: { ...colors },
    }));
  }, []);
  const setCustomColor = useCallback(
    (key: keyof ThemeColors, value: string) =>
      setState((s) => ({
        ...s,
        themePreset: "custom",
        customColors: { ...s.customColors, [key]: value },
      })),
    [],
  );
  const resetAll = useCallback(() => {
    setState({ ...defaults, sidebarOpen: true });
    // remove inline styles so @theme defaults kick back in
    const root = document.documentElement;
    [
      "--color-primary",
      "--color-accent",
      "--color-bg",
      "--color-text",
      "--color-card",
      "--color-border",
      "--color-surface",
    ].forEach((p) => root.style.removeProperty(p));
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        ...state,
        toggleSidebar,
        closeSidebar,
        setSnowEnabled,
        setFilmGrainEnabled,
        setParticlesEnabled,
        setAnimationsEnabled,
        setThemePreset,
        setCustomColor,
        resetAll,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}
