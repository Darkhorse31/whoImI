"use client";

import dynamic from "next/dynamic";
import { useCustomization } from "@/context/CustomizationContext";

const FilmGrain = dynamic(() => import("@/components/FilmGrain"), {
  ssr: false,
});
const SnowEffect = dynamic(() => import("@/components/SnowEffect"), {
  ssr: false,
});
const DayParticles = dynamic(() => import("@/components/DayParticles"), {
  ssr: false,
});

export default function ConditionalEffects() {
  const { filmGrainEnabled, snowEnabled, particlesEnabled } =
    useCustomization();

  return (
    <>
      {filmGrainEnabled && <FilmGrain />}
      {snowEnabled && <SnowEffect />}
      {particlesEnabled && <DayParticles />}
    </>
  );
}
