"use client";

import dynamic from "next/dynamic";

const InteractiveModel = dynamic(() => import("@/components/InteractiveModel"), {
  ssr: false,
});

export default function InteractiveModelWrapper() {
  return <InteractiveModel />;
}
