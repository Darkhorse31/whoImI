"use client";

import dynamic from "next/dynamic";
import { useDayNight } from "@/context/DayNightContext";
import { AnimatePresence, motion } from "framer-motion";

const StarField3D = dynamic(() => import("@/components/StarField3D"), {
  ssr: false,
});

const DaySky = dynamic(() => import("@/components/DaySky"), {
  ssr: false,
});

export default function DayNightEnvironment() {
  const { mode } = useDayNight();

  return (
    <AnimatePresence mode="wait">
      {mode === "night" ? (
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
