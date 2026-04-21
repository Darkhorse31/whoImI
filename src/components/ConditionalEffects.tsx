"use client";

import dynamic from "next/dynamic";
import { useCustomization } from "@/context/CustomizationContext";

const FilmGrain = dynamic(() => import("@/components/FilmGrain"), {
  ssr: false,
});
const SnowEffect = dynamic(() => import("@/components/SnowEffect"), {
  ssr: false,
});
const RainEffect = dynamic(() => import("@/components/RainEffect"), {
  ssr: false,
});
const StarsEffect = dynamic(() => import("@/components/StarsEffect"), {
  ssr: false,
});
const AnimatedBackground = dynamic(
  () => import("@/components/AnimatedBackground"),
  { ssr: false },
);
const OceanFishEffect = dynamic(
  () => import("@/components/OceanFishEffect"),
  { ssr: false },
);
const DayParticles = dynamic(() => import("@/components/DayParticles"), {
  ssr: false,
});

export default function ConditionalEffects() {
  const {
    filmGrainEnabled,
    snowEnabled,
    rainEnabled,
    starsEnabled,
    animatedBgEnabled,
    oceanFishEnabled,
    particlesEnabled,
  } = useCustomization();

  return (
    <>
      {animatedBgEnabled && <AnimatedBackground />}
      {starsEnabled && <StarsEffect />}
      {filmGrainEnabled && <FilmGrain />}
      {snowEnabled && <SnowEffect />}
      {rainEnabled && <RainEffect />}
      {oceanFishEnabled && <OceanFishEffect />}
      {particlesEnabled && <DayParticles />}
    </>
  );
}
