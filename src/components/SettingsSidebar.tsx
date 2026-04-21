"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Snowflake, Film, Sparkles, Zap } from "lucide-react";
import {
  useCustomization,
  THEME_PRESETS,
  type ThemeColors,
} from "@/context/CustomizationContext";
import { useDayNight } from "@/context/DayNightContext";

/* ─── Toggle switch ─── */
function Toggle({
  enabled,
  onChange,
  label,
  icon,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="settings-toggle-row">
      <span className="settings-toggle-label">
        {icon}
        {label}
      </span>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`settings-switch ${enabled ? "settings-switch-on" : ""}`}
      >
        <motion.span
          className="settings-switch-thumb"
          animate={{ x: enabled ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}

/* ─── Color picker row ─── */
function ColorPicker({
  label,
  value,
  colorKey,
}: {
  label: string;
  value: string;
  colorKey: keyof ThemeColors;
}) {
  const { setCustomColor } = useCustomization();
  return (
    <div className="settings-color-row">
      <span className="settings-color-label">{label}</span>
      <div className="settings-color-input-wrap">
        <input
          type="color"
          value={value}
          onChange={(e) => setCustomColor(colorKey, e.target.value)}
          className="settings-color-input"
          aria-label={`Choose ${label} color`}
        />
        <span className="settings-color-hex">{value}</span>
      </div>
    </div>
  );
}

/* ─── Theme preset swatch ─── */
function PresetSwatch({
  name,
  colors,
  active,
  onClick,
}: {
  name: string;
  colors: ThemeColors;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`settings-preset-swatch ${active ? "settings-preset-active" : ""}`}
      aria-label={`${name} theme`}
      title={name}
    >
      <div className="settings-preset-colors">
        <span style={{ background: colors.bg }} />
        <span style={{ background: colors.accent }} />
        <span style={{ background: colors.text }} />
      </div>
      <span className="settings-preset-name">{name}</span>
    </button>
  );
}

/* ─── Section heading ─── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {children}
    </div>
  );
}

/* ─── Main sidebar ─── */
export default function SettingsSidebar() {
  const {
    sidebarOpen,
    closeSidebar,
    snowEnabled,
    setSnowEnabled,
    filmGrainEnabled,
    setFilmGrainEnabled,
    particlesEnabled,
    setParticlesEnabled,
    animationsEnabled,
    setAnimationsEnabled,
    themePreset,
    setThemePreset,
    customColors,
    resetAll,
  } = useCustomization();

  const { mode, toggle: toggleDayNight } = useDayNight();

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="settings-backdrop"
            onClick={closeSidebar}
          />

          {/* Panel */}
          <motion.aside
            key="settings-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="settings-panel"
          >
            {/* Header */}
            <div className="settings-header">
              <h2 className="settings-title">Customize</h2>
              <button
                onClick={closeSidebar}
                className="settings-close-btn"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="settings-body">
              {/* Day / Night */}
              <Section title="Mode">
                <button
                  onClick={toggleDayNight}
                  className="settings-mode-btn"
                >
                  <span className="settings-mode-indicator">
                    {mode === "day" ? "☀️" : "🌙"}
                  </span>
                  <span>
                    {mode === "day" ? "Day Mode" : "Night Mode"}
                  </span>
                  <span className="settings-mode-switch-label">Tap to switch</span>
                </button>
              </Section>

              {/* Visual Effects */}
              <Section title="Visual Effects">
                <Toggle
                  enabled={snowEnabled}
                  onChange={setSnowEnabled}
                  label="Snow"
                  icon={<Snowflake size={14} />}
                />
                <Toggle
                  enabled={filmGrainEnabled}
                  onChange={setFilmGrainEnabled}
                  label="Film Grain"
                  icon={<Film size={14} />}
                />
                <Toggle
                  enabled={particlesEnabled}
                  onChange={setParticlesEnabled}
                  label="Particles"
                  icon={<Sparkles size={14} />}
                />
                <Toggle
                  enabled={animationsEnabled}
                  onChange={setAnimationsEnabled}
                  label="Animations"
                  icon={<Zap size={14} />}
                />
              </Section>

              {/* Theme Presets */}
              <Section title="Theme">
                <div className="settings-preset-grid">
                  {Object.entries(THEME_PRESETS).map(([name, colors]) => (
                    <PresetSwatch
                      key={name}
                      name={name}
                      colors={colors}
                      active={themePreset === name}
                      onClick={() => setThemePreset(name)}
                    />
                  ))}
                </div>
              </Section>

              {/* Fine-tune Colors */}
              <Section title="Fine-tune Colors">
                <ColorPicker
                  label="Background"
                  value={customColors.bg}
                  colorKey="bg"
                />
                <ColorPicker
                  label="Accent"
                  value={customColors.accent}
                  colorKey="accent"
                />
                <ColorPicker
                  label="Text"
                  value={customColors.text}
                  colorKey="text"
                />
                <ColorPicker
                  label="Card"
                  value={customColors.card}
                  colorKey="card"
                />
                <ColorPicker
                  label="Border"
                  value={customColors.border}
                  colorKey="border"
                />
              </Section>

              {/* Reset */}
              <div className="settings-reset-wrap">
                <button onClick={resetAll} className="settings-reset-btn">
                  <RotateCcw size={14} />
                  Reset to defaults
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
