"use client";

import dynamic from "next/dynamic";

const FilmGrain = dynamic(() => import("./FilmGrain"), { ssr: false });

export default function FilmGrainWrapper() {
  return <FilmGrain />;
}
