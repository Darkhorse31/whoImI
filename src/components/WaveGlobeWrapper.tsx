"use client";

import dynamic from "next/dynamic";

const WaveGlobe = dynamic(() => import("@/components/WaveGlobe"), {
  ssr: false,
});

export default function WaveGlobeWrapper() {
  return <WaveGlobe />;
}
