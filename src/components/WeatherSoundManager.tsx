"use client";

import { useEffect, useRef } from "react";
import { useCustomization } from "@/context/CustomizationContext";

/* ═══════════════════════════════════════════════════════════════
   Weather Sound Manager
   Plays ambient audio layers (rain, snow/wind, thunder rumble)
   with smooth crossfades based on active weather effects.
   ═══════════════════════════════════════════════════════════════ */

interface AudioLayer {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  buffer: AudioBuffer | null;
  targetVol: number;
  currentVol: number;
  loaded: boolean;
  looping: boolean;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.35; // overall volume cap
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  return audioCtx;
}

async function loadAudio(
  ctx: AudioContext,
  url: string,
): Promise<AudioBuffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const arrayBuf = await resp.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuf);
  } catch {
    return null;
  }
}

function createLayer(ctx: AudioContext): AudioLayer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(masterGain!);
  return {
    source: null,
    gain,
    buffer: null,
    targetVol: 0,
    currentVol: 0,
    loaded: false,
    looping: true,
  };
}

function startLayer(ctx: AudioContext, layer: AudioLayer) {
  if (!layer.buffer || layer.source) return;
  const src = ctx.createBufferSource();
  src.buffer = layer.buffer;
  src.loop = layer.looping;
  src.connect(layer.gain);
  src.start(0);
  layer.source = src;
}

function stopLayer(layer: AudioLayer) {
  if (layer.source) {
    try {
      layer.source.stop();
    } catch {
      /* already stopped */
    }
    layer.source.disconnect();
    layer.source = null;
  }
}

export default function WeatherSoundManager() {
  const { stormEnabled, snowEnabled } = useCustomization();
  const layersRef = useRef<{
    rain: AudioLayer | null;
    snow: AudioLayer | null;
    thunder: AudioLayer | null;
  }>({ rain: null, snow: null, thunder: null });
  const animRef = useRef(0);
  const initRef = useRef(false);

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;

    // Initialise layers once
    if (!initRef.current) {
      layersRef.current.rain = createLayer(ctx);
      layersRef.current.snow = createLayer(ctx);
      layersRef.current.thunder = createLayer(ctx);
      initRef.current = true;

      // Lazy-load audio buffers
      loadAudio(ctx, "/rain.mp3").then((buf) => {
        if (buf && layersRef.current.rain) {
          layersRef.current.rain.buffer = buf;
          layersRef.current.rain.loaded = true;
        }
      });
      loadAudio(ctx, "/snow.mp3").then((buf) => {
        if (buf && layersRef.current.snow) {
          layersRef.current.snow.buffer = buf;
          layersRef.current.snow.loaded = true;
        }
      });
      loadAudio(ctx, "/thunder.mp3").then((buf) => {
        if (buf && layersRef.current.thunder) {
          layersRef.current.thunder.buffer = buf;
          layersRef.current.thunder.loaded = true;
          layersRef.current.thunder.looping = true;
        }
      });
    }

    const layers = layersRef.current;

    // Set target volumes based on enabled state
    if (layers.rain) layers.rain.targetVol = stormEnabled ? 0.8 : 0;
    if (layers.snow) layers.snow.targetVol = snowEnabled ? 0.4 : 0;
    if (layers.thunder) layers.thunder.targetVol = stormEnabled ? 0.3 : 0;

    // Smooth volume ramping loop
    const ramp = () => {
      const FADE_SPEED = 0.008; // per frame
      for (const key of ["rain", "snow", "thunder"] as const) {
        const layer = layers[key];
        if (!layer || !layer.loaded) continue;

        const diff = layer.targetVol - layer.currentVol;

        if (Math.abs(diff) > 0.001) {
          layer.currentVol += Math.sign(diff) * Math.min(FADE_SPEED, Math.abs(diff));
          layer.gain.gain.value = layer.currentVol;

          // Start source when fading in
          if (layer.currentVol > 0.001 && !layer.source) {
            startLayer(ctx, layer);
          }
        }

        // Stop source when fully faded out
        if (layer.currentVol <= 0.001 && layer.source) {
          stopLayer(layer);
          layer.currentVol = 0;
          layer.gain.gain.value = 0;
        }
      }
      animRef.current = requestAnimationFrame(ramp);
    };

    animRef.current = requestAnimationFrame(ramp);

    // Resume AudioContext on user interaction
    const resume = () => {
      if (ctx.state === "suspended") ctx.resume();
    };
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [stormEnabled, snowEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const layers = layersRef.current;
      for (const key of ["rain", "snow", "thunder"] as const) {
        const layer = layers[key];
        if (layer) stopLayer(layer);
      }
    };
  }, []);

  return null;
}
