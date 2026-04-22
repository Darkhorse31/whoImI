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
  stormEnabled: boolean;
  starsEnabled: boolean;
  animatedBgEnabled: boolean;
  oceanFishEnabled: boolean;
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
  setStormEnabled: (v: boolean) => void;
  setStarsEnabled: (v: boolean) => void;
  setAnimatedBgEnabled: (v: boolean) => void;
  setOceanFishEnabled: (v: boolean) => void;
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
  stormEnabled: false,
  starsEnabled: false,
  animatedBgEnabled: false,
  oceanFishEnabled: false,
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
  setStormEnabled: () => {},
  setStarsEnabled: () => {},
  setAnimatedBgEnabled: () => {},
  setOceanFishEnabled: () => {},
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
    const parsed = JSON.parse(raw);
    /* Migrate legacy separate rain/thunder toggles → stormEnabled */
    if ("rainEnabled" in parsed || "thunderEnabled" in parsed) {
      parsed.stormEnabled = parsed.rainEnabled || parsed.thunderEnabled || false;
      delete parsed.rainEnabled;
      delete parsed.thunderEnabled;
    }
    return parsed;
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

/* ─── Sanitize CSS color values to prevent injection ─── */
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
function safeCSSColor(value: string): string | null {
  return HEX_RE.test(value) ? value : null;
}

/* ─── Apply theme via injected <style> with a mode-aware selector ─── */
const STYLE_ID = "custom-theme-colors";

function applyThemeColors(colors: ThemeColors, isDefault: boolean) {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  /* When using the default preset, remove injected overrides so the
     original @theme / [data-mode="day"] rules in globals.css take over. */
  if (isDefault) {
    styleEl.textContent = "";
    return;
  }

  /* Build safe declarations */
  const entries: [string, string][] = [
    ["--color-primary", colors.primary],
    ["--color-accent", colors.accent],
    ["--color-bg", colors.bg],
    ["--color-text", colors.text],
    ["--color-card", colors.card],
    ["--color-border", colors.border],
    ["--color-surface", colors.surface],
  ];

  const declarations = entries
    .map(([prop, val]) => {
      const safe = safeCSSColor(val);
      return safe ? `${prop}: ${safe};` : null;
    })
    .filter(Boolean)
    .join("\n      ");

  /* Apply custom colors in BOTH modes:
     - Night: :root:not([data-mode="day"]) overrides the @theme defaults.
     - Day: [data-mode="day"] with higher specificity (html[...]) overrides
       the hardcoded day palette in globals.css. */
  styleEl.textContent = `
    :root:not([data-mode="day"]) {
      ${declarations}
    }
    html[data-mode="day"] {
      ${declarations}
    }
    html[data-mode="day"] body {
      background: var(--color-bg);
      color: var(--color-text);
    }
  `;
}

function clearThemeColors() {
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl) styleEl.remove();
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  /* Start with fixed defaults so server & client HTML match (no hydration mismatch).
     localStorage values are loaded in the useEffect below (client-only). */
  const [state, setState] = useState<CustomizationState>(defaults);
  const [hydrated, setHydrated] = useState(false);

  /* Hydrate from localStorage after mount */
  useEffect(() => {
    const stored = loadFromStorage();
    if (Object.keys(stored).length > 0) {
      setState((s) => ({ ...s, ...stored, sidebarOpen: false }));
    }
    setHydrated(true);
  }, []);

  /* Persist on change (only after hydration to avoid overwriting with defaults) */
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state);
  }, [state, hydrated]);

  /* Apply CSS vars whenever custom colors or preset change — the injected
     <style> covers both night and day selectors. When on the "default"
     preset we clear the overrides so the original CSS takes over. */
  useEffect(() => {
    applyThemeColors(state.customColors, state.themePreset === "default");
  }, [state.customColors, state.themePreset]);

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
  const setStormEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, stormEnabled: v })),
    [],
  );
  const setStarsEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, starsEnabled: v })),
    [],
  );
  const setAnimatedBgEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, animatedBgEnabled: v })),
    [],
  );
  const setOceanFishEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, oceanFishEnabled: v })),
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
    clearThemeColors();
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        ...state,
        toggleSidebar,
        closeSidebar,
        setSnowEnabled,
        setStormEnabled,
        setStarsEnabled,
        setAnimatedBgEnabled,
        setOceanFishEnabled,
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
