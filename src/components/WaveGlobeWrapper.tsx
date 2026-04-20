"use client";

import dynamic from "next/dynamic";
import { useDayNight } from "@/context/DayNightContext";

const WaveGlobe = dynamic(() => import("@/components/WaveGlobe"), {
  ssr: false,
});

export default function WaveGlobeWrapper() {
  const { mode } = useDayNight();
  return <WaveGlobe mode={mode} />;
}
