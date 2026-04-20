"use client";

import dynamic from "next/dynamic";
import { useDayNight } from "@/context/DayNightContext";

const InteractiveModel = dynamic(() => import("@/components/InteractiveModel"), {
  ssr: false,
});

export default function InteractiveModelWrapper() {
  const { mode } = useDayNight();
  // Hide during daytime — DaySky already renders the sun on canvas
  if (mode === "day") return null;
  return <InteractiveModel />;
}
