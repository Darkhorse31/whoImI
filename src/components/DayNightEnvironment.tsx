"use client";

import dynamic from "next/dynamic";
import { useDayNight } from "@/context/DayNightContext";
import { useCustomization } from "@/context/CustomizationContext";
import { AnimatePresence, motion } from "framer-motion";

const StarField3D = dynamic(() => import("@/components/StarField3D"), {
  ssr: false,
});

const DaySky = dynamic(() => import("@/components/DaySky"), {
  ssr: false,
});

export default function DayNightEnvironment() {
  const { mode } = useDayNight();
  const { themePreset, customColors } = useCustomization();

  const hasCustomTheme = themePreset !== "default";

  return (
    <AnimatePresence mode="wait">
      {hasCustomTheme ? (
        /* When a custom theme is active, show the custom bg color as the
           full-screen background instead of the sky/starfield canvas. */
        <motion.div
          key="custom-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-0"
          style={{ background: customColors.bg }}
        />
      ) : mode === "night" ? (
        <motion.div
          key="night"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-0"
        >
          <StarField3D />
        </motion.div>
      ) : (
        <motion.div
          key="day"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-0"
        >
          <DaySky />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
